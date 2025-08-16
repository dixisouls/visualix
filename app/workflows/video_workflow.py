"""
LangGraph workflow engine for video processing orchestration.
Manages state and executes tool sequences planned by Gemini agent.
"""

import asyncio
import logging
import time
import json
from typing import Dict, Any, List, Optional, TypedDict
from pathlib import Path

from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from app.config import settings
from app.core.exceptions import LangGraphWorkflowError, OpenCVToolError
from app.services.gemini_agent import WorkflowPlan, ToolPlan
from app.tools import get_tool_by_name, TOOL_REGISTRY
from app.models.video_models import ToolExecution, WorkflowExecution


class VideoProcessingState(TypedDict):
    """State structure for video processing workflow."""
    job_id: str
    input_video_path: str
    current_video_path: str
    workflow_plan: Dict[str, Any]
    executed_tools: List[Dict[str, Any]]
    current_tool_index: int
    total_tools: int
    start_time: float
    last_update_time: float
    status: str  # "running", "completed", "failed", "cancelled"
    error_message: Optional[str]
    progress: int  # 0-100


class VideoWorkflowEngine:
    """
    LangGraph-based workflow engine for video processing.
    Orchestrates tool execution with state management and error handling.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.active_workflows: Dict[str, StateGraph] = {}
        self.workflow_states: Dict[str, VideoProcessingState] = {}
        
    def create_workflow(self, job_id: str) -> StateGraph:
        """Create a new LangGraph workflow for video processing."""
        
        # Define the workflow graph
        workflow = StateGraph(VideoProcessingState)
        
        # Add nodes
        workflow.add_node("initialize", self._initialize_node)
        workflow.add_node("execute_tool", self._execute_tool_node)
        workflow.add_node("check_completion", self._check_completion_node)
        workflow.add_node("finalize", self._finalize_node)
        workflow.add_node("handle_error", self._handle_error_node)
        
        # Define edges
        workflow.set_entry_point("initialize")
        workflow.add_edge("initialize", "execute_tool")
        workflow.add_conditional_edges(
            "execute_tool",
            self._should_continue,
            {
                "continue": "check_completion",
                "error": "handle_error",
                "cancelled": "finalize"
            }
        )
        workflow.add_conditional_edges(
            "check_completion",
            self._check_completion_condition,
            {
                "next_tool": "execute_tool",
                "complete": "finalize"
            }
        )
        workflow.add_edge("handle_error", "finalize")
        workflow.add_edge("finalize", END)
        
        # Compile the workflow
        compiled_workflow = workflow.compile()
        self.active_workflows[job_id] = compiled_workflow
        
        self.logger.info(f"Created workflow for job {job_id}")
        return compiled_workflow
    
    async def execute_workflow(
        self, 
        job_id: str, 
        input_video_path: str, 
        workflow_plan: WorkflowPlan
    ) -> WorkflowExecution:
        """
        Execute a video processing workflow.
        
        Args:
            job_id: Unique job identifier
            input_video_path: Path to input video file
            workflow_plan: Workflow plan from Gemini agent
            
        Returns:
            WorkflowExecution result
        """
        try:
            self.logger.info(f"Starting workflow execution for job {job_id}")
            
            # Create workflow if it doesn't exist
            if job_id not in self.active_workflows:
                self.create_workflow(job_id)
            
            # Initialize state
            initial_state = VideoProcessingState(
                job_id=job_id,
                input_video_path=input_video_path,
                current_video_path=input_video_path,
                workflow_plan={
                    "prompt": workflow_plan.prompt,
                    "reasoning": workflow_plan.reasoning,
                    "execution_type": workflow_plan.execution_type,
                    "estimated_time": workflow_plan.estimated_time,
                    "complexity_score": workflow_plan.complexity_score,
                    "tool_sequence": [
                        {
                            "tool_name": tool.tool_name,
                            "parameters": tool.parameters,
                            "reasoning": tool.reasoning,
                            "expected_output": tool.expected_output
                        } for tool in workflow_plan.tool_sequence
                    ]
                },
                executed_tools=[],
                current_tool_index=0,
                total_tools=len(workflow_plan.tool_sequence),
                start_time=time.time(),
                last_update_time=time.time(),
                status="running",
                error_message=None,
                progress=0
            )
            
            self.workflow_states[job_id] = initial_state
            
            # Execute workflow
            workflow = self.active_workflows[job_id]
            final_state = await workflow.ainvoke(initial_state)
            
            # Create execution result
            execution_result = self._create_execution_result(final_state)
            
            self.logger.info(f"Workflow completed for job {job_id} with status: {execution_result.success}")
            return execution_result
            
        except Exception as e:
            self.logger.error(f"Workflow execution failed for job {job_id}: {str(e)}")
            
            # Create failed execution result
            return WorkflowExecution(
                workflow_id=job_id,
                gemini_reasoning=workflow_plan.reasoning,
                planned_tools=[tool.tool_name for tool in workflow_plan.tool_sequence],
                executed_tools=[],
                total_execution_time=time.time() - time.time(),
                success=False
            )
    
    async def _initialize_node(self, state: VideoProcessingState) -> VideoProcessingState:
        """Initialize workflow execution."""
        self.logger.info(f"Initializing workflow for job {state['job_id']}")
        
        # Validate input video exists
        if not Path(state["input_video_path"]).exists():
            raise LangGraphWorkflowError(f"Input video not found: {state['input_video_path']}")
        
        # Update state
        state["status"] = "running"
        state["last_update_time"] = time.time()
        
        return state
    
    async def _execute_tool_node(self, state: VideoProcessingState) -> VideoProcessingState:
        """Execute the current tool in the sequence."""
        current_index = state["current_tool_index"]
        tool_sequence = state["workflow_plan"]["tool_sequence"]
        
        if current_index >= len(tool_sequence):
            state["status"] = "completed"
            return state
        
        current_tool_plan = tool_sequence[current_index]
        tool_name = current_tool_plan["tool_name"]
        tool_parameters = current_tool_plan["parameters"]
        
        self.logger.info(f"Executing tool {tool_name} (step {current_index + 1}/{state['total_tools']})")
        
        try:
            # Get tool class and create instance
            tool_class = get_tool_by_name(tool_name)
            tool_instance = tool_class()
            
            # Execute tool with current video as input
            start_time = time.time()
            result = await tool_instance.execute(
                video_path=state["current_video_path"],
                **tool_parameters
            )
            execution_time = time.time() - start_time
            
            # Create tool execution record
            tool_execution = {
                "tool_name": tool_name,
                "parameters": tool_parameters,
                "execution_time": execution_time,
                "status": "success" if result.success else "failed",
                "output_path": result.output_path,
                "error": result.error_message,
                "metadata": result.metadata
            }
            
            # Update state
            state["executed_tools"].append(tool_execution)
            
            if result.success and result.output_path:
                # Update current video path for next tool
                state["current_video_path"] = result.output_path
                self.logger.info(f"Tool {tool_name} completed successfully")
            else:
                # Tool failed
                state["status"] = "failed"
                state["error_message"] = result.error_message
                self.logger.error(f"Tool {tool_name} failed: {result.error_message}")
                return state
            
            # Update progress
            progress = int(((current_index + 1) / state["total_tools"]) * 100)
            state["progress"] = progress
            state["current_tool_index"] = current_index + 1
            state["last_update_time"] = time.time()
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error executing tool {tool_name}: {str(e)}")
            
            # Record failed tool execution
            tool_execution = {
                "tool_name": tool_name,
                "parameters": tool_parameters,
                "execution_time": time.time() - start_time if 'start_time' in locals() else 0,
                "status": "failed",
                "output_path": None,
                "error": str(e),
                "metadata": {}
            }
            
            state["executed_tools"].append(tool_execution)
            state["status"] = "failed"
            state["error_message"] = str(e)
            
            return state
    
    async def _check_completion_node(self, state: VideoProcessingState) -> VideoProcessingState:
        """Check if workflow is complete."""
        current_index = state["current_tool_index"]
        total_tools = state["total_tools"]
        
        if current_index >= total_tools:
            state["status"] = "completed"
            state["progress"] = 100
            self.logger.info(f"Workflow completed for job {state['job_id']}")
        
        state["last_update_time"] = time.time()
        return state
    
    async def _finalize_node(self, state: VideoProcessingState) -> VideoProcessingState:
        """Finalize workflow execution."""
        total_time = time.time() - state["start_time"]
        
        self.logger.info(f"Finalizing workflow for job {state['job_id']} - Status: {state['status']}, Time: {total_time:.2f}s")
        
        state["last_update_time"] = time.time()
        
        # Cleanup intermediate files if needed
        await self._cleanup_intermediate_files(state)
        
        return state
    
    async def _handle_error_node(self, state: VideoProcessingState) -> VideoProcessingState:
        """Handle workflow errors."""
        self.logger.error(f"Handling error for job {state['job_id']}: {state['error_message']}")
        
        state["status"] = "failed"
        state["last_update_time"] = time.time()
        
        return state
    
    def _should_continue(self, state: VideoProcessingState) -> str:
        """Determine next step after tool execution."""
        if state["status"] == "failed":
            return "error"
        elif state["status"] == "cancelled":
            return "cancelled"
        else:
            return "continue"
    
    def _check_completion_condition(self, state: VideoProcessingState) -> str:
        """Determine if workflow is complete or should continue."""
        if state["status"] == "completed":
            return "complete"
        else:
            return "next_tool"
    
    async def _cleanup_intermediate_files(self, state: VideoProcessingState):
        """Clean up intermediate video files to save disk space."""
        try:
            # Keep original input and final output, remove intermediate files
            files_to_keep = {state["input_video_path"], state["current_video_path"]}
            
            for tool_execution in state["executed_tools"]:
                output_path = tool_execution.get("output_path")
                if output_path and output_path not in files_to_keep:
                    # Only delete if it's clearly an intermediate file
                    path = Path(output_path)
                    if path.exists() and "temp" in str(path) or "_intermediate" in str(path):
                        path.unlink()
                        self.logger.debug(f"Cleaned up intermediate file: {output_path}")
        except Exception as e:
            self.logger.warning(f"Error during cleanup: {str(e)}")
    
    def _create_execution_result(self, final_state: VideoProcessingState) -> WorkflowExecution:
        """Create WorkflowExecution result from final state."""
        
        # Convert executed tools to ToolExecution objects
        executed_tools = []
        for tool_data in final_state["executed_tools"]:
            tool_execution = ToolExecution(
                tool_name=tool_data["tool_name"],
                parameters=tool_data["parameters"],
                execution_time=tool_data["execution_time"],
                status=tool_data["status"],
                output_path=tool_data.get("output_path"),
                error=tool_data.get("error")
            )
            executed_tools.append(tool_execution)
        
        # Calculate total execution time
        total_time = time.time() - final_state["start_time"]
        
        return WorkflowExecution(
            workflow_id=final_state["job_id"],
            gemini_reasoning=final_state["workflow_plan"]["reasoning"],
            planned_tools=[tool["tool_name"] for tool in final_state["workflow_plan"]["tool_sequence"]],
            executed_tools=executed_tools,
            total_execution_time=total_time,
            success=final_state["status"] == "completed"
        )
    
    def get_workflow_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a workflow."""
        if job_id not in self.workflow_states:
            return None
        
        state = self.workflow_states[job_id]
        return {
            "job_id": job_id,
            "status": state["status"],
            "progress": state["progress"],
            "current_tool": state["current_tool_index"],
            "total_tools": state["total_tools"],
            "execution_time": time.time() - state["start_time"],
            "last_update": state["last_update_time"],
            "error_message": state.get("error_message"),
            "executed_tools": len(state["executed_tools"])
        }
    
    async def cancel_workflow(self, job_id: str) -> bool:
        """Cancel a running workflow."""
        if job_id not in self.workflow_states:
            return False
        
        state = self.workflow_states[job_id]
        if state["status"] == "running":
            state["status"] = "cancelled"
            state["last_update_time"] = time.time()
            self.logger.info(f"Cancelled workflow for job {job_id}")
            return True
        
        return False
    
    def cleanup_workflow(self, job_id: str):
        """Clean up workflow resources."""
        if job_id in self.active_workflows:
            del self.active_workflows[job_id]
        if job_id in self.workflow_states:
            del self.workflow_states[job_id]
        
        self.logger.debug(f"Cleaned up workflow resources for job {job_id}")
