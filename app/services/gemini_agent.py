"""
Gemini Agent Service for intelligent video processing workflow planning.
Analyzes user prompts and determines appropriate tool sequences.
"""

import json
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.config import settings
from app.core.exceptions import GeminiAPIError
from app.tools import get_tool_descriptions


@dataclass
class ToolPlan:
    """Represents a planned tool execution."""
    tool_name: str
    parameters: Dict[str, Any]
    reasoning: str
    expected_output: str


@dataclass
class WorkflowPlan:
    """Represents a complete workflow plan."""
    prompt: str
    reasoning: str
    tool_sequence: List[ToolPlan]
    execution_type: str  # "sequential" or "parallel"
    estimated_time: float
    complexity_score: int  # 1-5 scale


class GeminiAgent:
    """
    Google Gemini AI agent for video processing workflow orchestration.
    Analyzes natural language prompts and plans optimal tool execution sequences.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialize_gemini()
        self.tool_descriptions = get_tool_descriptions()
        
    def _initialize_gemini(self):
        """Initialize Gemini API client."""
        if not settings.gemini_api_key or settings.gemini_api_key == "dummy-key-for-testing":
            # Skip initialization for testing or when not configured
            self.model = None
            if not settings.gemini_api_key:
                self.logger.warning("GEMINI_API_KEY not configured - some features will be disabled")
            return
        
        try:
            genai.configure(api_key=settings.gemini_api_key)
        except Exception as e:
            if settings.gemini_api_key == "dummy-key-for-testing":
                # Skip initialization for testing
                self.model = None
                return
            else:
                raise GeminiAPIError(f"Failed to configure Gemini: {str(e)}")
        
        # Configure the model
        generation_config = {
            "temperature": 0.1,  # Low temperature for consistent planning
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }
        
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        self.logger.info(f"Gemini agent initialized with model: {settings.gemini_model}")
    
    def _create_system_prompt(self) -> str:
        """Create the system prompt for video processing workflow planning."""
        tools_json = json.dumps(self.tool_descriptions, indent=2)
        
        return f"""You are an expert video processing AI agent that analyzes user requests and plans optimal video editing workflows.

Your role is to:
1. Understand natural language video editing requests
2. Select appropriate tools from the available toolkit
3. Plan the optimal sequence and parameters for tool execution
4. Provide clear reasoning for your decisions

Available Tools:
{tools_json}

Guidelines:
- Always respond with valid JSON in the specified format
- Choose tools that best achieve the user's intent
- Consider the order of operations (e.g., color adjustments before effects)
- Provide realistic parameter values within tool constraints
- Explain your reasoning clearly
- Estimate complexity on a 1-5 scale (1=simple, 5=very complex)
- Estimate execution time in seconds
- Use "sequential" execution unless tools can truly be parallelized

Response Format:
{{
    "reasoning": "Your detailed reasoning for tool selection and sequencing",
    "execution_type": "sequential",
    "estimated_time": 60.0,
    "complexity_score": 3,
    "tool_sequence": [
        {{
            "tool_name": "tool_name_from_registry",
            "parameters": {{"param1": value1, "param2": value2}},
            "reasoning": "Why this specific tool and these parameters",
            "expected_output": "What this step will accomplish"
        }}
    ]
}}

Examples of user requests and appropriate responses:
- "make it look vintage" → sepia + vignette + film grain
- "brighten the video" → adjust_brightness with positive value
- "add blur effect" → apply_gaussian_blur with appropriate strength
- "make it black and white with high contrast" → adjust_saturation (0.0) + adjust_contrast (high value)
- "rotate 90 degrees" → rotate_video with angle=90

Remember: Always provide practical, achievable workflows with realistic parameters."""
    
    async def analyze_prompt(self, prompt: str, video_metadata: Optional[Dict] = None) -> WorkflowPlan:
        """
        Analyze a user prompt and generate a workflow plan.
        
        Args:
            prompt: User's natural language request
            video_metadata: Optional metadata about the video for context
            
        Returns:
            WorkflowPlan object with detailed execution plan
        """
        try:
            self.logger.info(f"Analyzing prompt: {prompt}")
            
            # Prepare the user message
            user_message = f"""
Please analyze this video editing request and create a workflow plan:

User Request: "{prompt}"

Video Context: {json.dumps(video_metadata) if video_metadata else "No metadata provided"}

Respond with a detailed JSON workflow plan using the available tools.
"""
            
            # Create the chat and get response
            chat = self.model.start_chat(history=[])
            
            # Send system prompt first
            system_response = chat.send_message(self._create_system_prompt())
            
            # Send user request
            response = chat.send_message(user_message)
            
            # Parse the response
            workflow_plan = self._parse_response(response.text, prompt)
            
            self.logger.info(f"Generated workflow plan with {len(workflow_plan.tool_sequence)} tools")
            return workflow_plan
            
        except Exception as e:
            self.logger.error(f"Error analyzing prompt: {str(e)}")
            raise GeminiAPIError(f"Failed to analyze prompt: {str(e)}")
    
    def _parse_response(self, response_text: str, original_prompt: str) -> WorkflowPlan:
        """Parse Gemini's JSON response into a WorkflowPlan."""
        try:
            # Clean the response (remove markdown code blocks if present)
            cleaned_response = response_text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON
            response_data = json.loads(cleaned_response)
            
            # Validate required fields
            required_fields = ["reasoning", "execution_type", "estimated_time", "complexity_score", "tool_sequence"]
            for field in required_fields:
                if field not in response_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Parse tool sequence
            tool_sequence = []
            for tool_data in response_data["tool_sequence"]:
                # Validate tool exists
                tool_name = tool_data["tool_name"]
                if tool_name not in self.tool_descriptions:
                    self.logger.warning(f"Unknown tool: {tool_name}, skipping")
                    continue
                
                tool_plan = ToolPlan(
                    tool_name=tool_name,
                    parameters=tool_data.get("parameters", {}),
                    reasoning=tool_data.get("reasoning", ""),
                    expected_output=tool_data.get("expected_output", "")
                )
                tool_sequence.append(tool_plan)
            
            # Create workflow plan
            workflow_plan = WorkflowPlan(
                prompt=original_prompt,
                reasoning=response_data["reasoning"],
                tool_sequence=tool_sequence,
                execution_type=response_data["execution_type"],
                estimated_time=float(response_data["estimated_time"]),
                complexity_score=int(response_data["complexity_score"])
            )
            
            return workflow_plan
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON response: {e}")
            self.logger.error(f"Raw response: {response_text}")
            raise GeminiAPIError(f"Invalid JSON response from Gemini: {e}")
        except Exception as e:
            self.logger.error(f"Error parsing response: {e}")
            raise GeminiAPIError(f"Failed to parse Gemini response: {e}")
    
    async def refine_workflow(self, workflow_plan: WorkflowPlan, feedback: str) -> WorkflowPlan:
        """
        Refine an existing workflow plan based on feedback or errors.
        
        Args:
            workflow_plan: Original workflow plan
            feedback: Feedback or error information
            
        Returns:
            Refined WorkflowPlan
        """
        try:
            self.logger.info("Refining workflow plan based on feedback")
            
            refinement_prompt = f"""
Please refine this video processing workflow based on the feedback provided:

Original Prompt: "{workflow_plan.prompt}"
Original Plan: {json.dumps({
                'reasoning': workflow_plan.reasoning,
                'execution_type': workflow_plan.execution_type,
                'tool_sequence': [
                    {
                        'tool_name': tool.tool_name,
                        'parameters': tool.parameters,
                        'reasoning': tool.reasoning
                    } for tool in workflow_plan.tool_sequence
                ]
            }, indent=2)}

Feedback/Issues: "{feedback}"

Please provide a refined workflow plan that addresses the feedback while maintaining the original intent.
Respond with the same JSON format as before.
"""
            
            chat = self.model.start_chat(history=[])
            system_response = chat.send_message(self._create_system_prompt())
            response = chat.send_message(refinement_prompt)
            
            refined_plan = self._parse_response(response.text, workflow_plan.prompt)
            
            self.logger.info("Workflow plan refined successfully")
            return refined_plan
            
        except Exception as e:
            self.logger.error(f"Error refining workflow: {str(e)}")
            raise GeminiAPIError(f"Failed to refine workflow: {str(e)}")
    
    def validate_workflow_plan(self, workflow_plan: WorkflowPlan) -> List[str]:
        """
        Validate a workflow plan for potential issues.
        
        Returns:
            List of warning messages (empty if no issues)
        """
        warnings = []
        
        # Check for empty tool sequence
        if not workflow_plan.tool_sequence:
            warnings.append("Workflow has no tools selected")
        
        # Check for unknown tools
        for tool in workflow_plan.tool_sequence:
            if tool.tool_name not in self.tool_descriptions:
                warnings.append(f"Unknown tool: {tool.tool_name}")
        
        # Check for unrealistic complexity/time estimates
        if workflow_plan.complexity_score < 1 or workflow_plan.complexity_score > 5:
            warnings.append(f"Complexity score {workflow_plan.complexity_score} is outside valid range (1-5)")
        
        if workflow_plan.estimated_time < 1:
            warnings.append(f"Estimated time {workflow_plan.estimated_time} seems unrealistically low")
        
        # Check for parameter validation
        for tool in workflow_plan.tool_sequence:
            tool_desc = self.tool_descriptions.get(tool.tool_name)
            if not tool_desc:
                continue
                
            # Basic parameter presence check
            required_params = tool_desc.get("parameters", {})
            for param_name, param_info in required_params.items():
                if param_name == "video_path":  # This is provided at execution time
                    continue
                if param_name not in tool.parameters:
                    if "default" not in param_info:
                        warnings.append(f"Tool {tool.tool_name} missing required parameter: {param_name}")
        
        return warnings
    
    async def explain_workflow(self, workflow_plan: WorkflowPlan) -> str:
        """
        Generate a human-readable explanation of the workflow plan.
        
        Returns:
            Detailed explanation string
        """
        try:
            explanation_prompt = f"""
Please provide a clear, user-friendly explanation of this video processing workflow:

User Request: "{workflow_plan.prompt}"
Planned Workflow: {json.dumps({
                'reasoning': workflow_plan.reasoning,
                'execution_type': workflow_plan.execution_type,
                'estimated_time': workflow_plan.estimated_time,
                'complexity_score': workflow_plan.complexity_score,
                'tool_sequence': [
                    {
                        'tool_name': tool.tool_name,
                        'parameters': tool.parameters,
                        'reasoning': tool.reasoning
                    } for tool in workflow_plan.tool_sequence
                ]
            }, indent=2)}

Provide a friendly explanation that:
1. Summarizes what will be done to the video
2. Explains each processing step in simple terms
3. Mentions the estimated processing time
4. Sets appropriate expectations

Keep it conversational and easy to understand for non-technical users.
"""
            
            chat = self.model.start_chat(history=[])
            response = chat.send_message(explanation_prompt)
            
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error generating explanation: {str(e)}")
            # Fallback to basic explanation
            return self._generate_basic_explanation(workflow_plan)
    
    def _generate_basic_explanation(self, workflow_plan: WorkflowPlan) -> str:
        """Generate a basic explanation as fallback."""
        explanation = f"I'll process your video request: '{workflow_plan.prompt}'\n\n"
        explanation += f"This will involve {len(workflow_plan.tool_sequence)} processing steps:\n"
        
        for i, tool in enumerate(workflow_plan.tool_sequence, 1):
            explanation += f"{i}. {tool.expected_output or f'Apply {tool.tool_name}'}\n"
        
        explanation += f"\nEstimated processing time: {workflow_plan.estimated_time:.0f} seconds"
        explanation += f"\nComplexity level: {workflow_plan.complexity_score}/5"
        
        return explanation
