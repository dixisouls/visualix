"""
Simplified workflow engine for video processing without LangGraph dependencies.
This provides the same functionality but with a simpler implementation.
"""

import asyncio
import logging
import time
import json
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.config import settings
from app.core.exceptions import VideoProcessingError, OpenCVToolError
from app.services.gemini_agent import WorkflowPlan, ToolPlan
from app.tools import get_tool_by_name
from app.models.video_models import ToolExecution, WorkflowExecution


class SimpleWorkflowEngine:
    """
    Simplified workflow engine for video processing.
    Executes tool sequences planned by Gemini agent without LangGraph dependency.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.active_workflows: Dict[str, dict] = {}
        
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
        start_time = time.time()
        executed_tools = []
        current_video_path = input_video_path
        
        try:
            self.logger.info(f"Starting workflow execution for job {job_id}")
            
            # Initialize workflow state
            workflow_state = {
                "job_id": job_id,
                "status": "running",
                "current_tool": 0,
                "total_tools": len(workflow_plan.tool_sequence),
                "start_time": start_time
            }
            self.active_workflows[job_id] = workflow_state
            
            # Execute tools sequentially
            for i, tool_plan in enumerate(workflow_plan.tool_sequence):
                # Update progress
                workflow_state["current_tool"] = i
                
                self.logger.info(f"Executing tool {i + 1}/{len(workflow_plan.tool_sequence)}: {tool_plan.tool_name}")
                
                # Execute tool
                tool_result = await self._execute_tool(
                    tool_plan=tool_plan,
                    input_path=current_video_path,
                    job_id=job_id
                )
                
                # Record execution
                executed_tools.append(tool_result)
                
                # Check if tool succeeded
                if tool_result.status == "success" and tool_result.output_path:
                    current_video_path = tool_result.output_path
                    self.logger.info(f"Tool {tool_plan.tool_name} completed successfully")
                else:
                    # Tool failed
                    error_msg = tool_result.error or f"Tool {tool_plan.tool_name} failed"
                    self.logger.error(error_msg)
                    
                    workflow_state["status"] = "failed"
                    
                    return WorkflowExecution(
                        workflow_id=job_id,
                        gemini_reasoning=workflow_plan.reasoning,
                        planned_tools=[t.tool_name for t in workflow_plan.tool_sequence],
                        executed_tools=executed_tools,
                        total_execution_time=time.time() - start_time,
                        success=False
                    )
            
            # All tools completed successfully
            workflow_state["status"] = "completed"
            total_time = time.time() - start_time
            
            self.logger.info(f"Workflow completed successfully for job {job_id} in {total_time:.2f}s")
            
            return WorkflowExecution(
                workflow_id=job_id,
                gemini_reasoning=workflow_plan.reasoning,
                planned_tools=[t.tool_name for t in workflow_plan.tool_sequence],
                executed_tools=executed_tools,
                total_execution_time=total_time,
                success=True
            )
            
        except Exception as e:
            self.logger.error(f"Workflow execution failed for job {job_id}: {str(e)}")
            
            if job_id in self.active_workflows:
                self.active_workflows[job_id]["status"] = "failed"
            
            return WorkflowExecution(
                workflow_id=job_id,
                gemini_reasoning=workflow_plan.reasoning,
                planned_tools=[t.tool_name for t in workflow_plan.tool_sequence],
                executed_tools=executed_tools,
                total_execution_time=time.time() - start_time,
                success=False
            )
        
        finally:
            # Cleanup workflow state
            if job_id in self.active_workflows:
                del self.active_workflows[job_id]
    
    async def _execute_tool(
        self, 
        tool_plan: ToolPlan, 
        input_path: str, 
        job_id: str
    ) -> ToolExecution:
        """Execute a single tool."""
        start_time = time.time()
        
        try:
            # Get tool class and create instance
            tool_class = get_tool_by_name(tool_plan.tool_name)
            tool_instance = tool_class()
            
            # Execute tool
            result = await tool_instance.execute(
                video_path=input_path,
                **tool_plan.parameters
            )
            
            execution_time = time.time() - start_time
            
            return ToolExecution(
                tool_name=tool_plan.tool_name,
                parameters=tool_plan.parameters,
                execution_time=execution_time,
                status="success" if result.success else "failed",
                output_path=result.output_path,
                error=result.error_message
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Tool {tool_plan.tool_name} failed: {str(e)}"
            self.logger.error(error_msg)
            
            return ToolExecution(
                tool_name=tool_plan.tool_name,
                parameters=tool_plan.parameters,
                execution_time=execution_time,
                status="failed",
                output_path=None,
                error=error_msg
            )
    
    def get_workflow_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a workflow."""
        if job_id not in self.active_workflows:
            return None
        
        state = self.active_workflows[job_id]
        current_tool = state.get("current_tool", 0)
        total_tools = state.get("total_tools", 1)
        
        # Calculate progress
        progress = int((current_tool / total_tools) * 100) if total_tools > 0 else 0
        
        return {
            "job_id": job_id,
            "status": state["status"],
            "progress": progress,
            "current_tool": current_tool,
            "total_tools": total_tools,
            "execution_time": time.time() - state["start_time"],
            "last_update": time.time()
        }
    
    async def cancel_workflow(self, job_id: str) -> bool:
        """Cancel a running workflow."""
        if job_id not in self.active_workflows:
            return False
        
        state = self.active_workflows[job_id]
        if state["status"] == "running":
            state["status"] = "cancelled"
            self.logger.info(f"Cancelled workflow for job {job_id}")
            return True
        
        return False
    
    def cleanup_workflow(self, job_id: str):
        """Clean up workflow resources."""
        if job_id in self.active_workflows:
            del self.active_workflows[job_id]
        
        self.logger.debug(f"Cleaned up workflow resources for job {job_id}")
