"""
Modern Gemini Agent Service using the latest Google Generative AI SDK (v0.8.5+).
Completely rewritten implementation based on current API patterns.
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
    Modern Google Gemini AI agent using the latest SDK for video processing workflow orchestration.
    Analyzes natural language prompts and plans optimal tool execution sequences.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.model = None
        self._initialize_gemini()
        print("Gemini agent initialized")
        self.tool_descriptions = self._get_serializable_tool_descriptions()
        
    def _initialize_gemini(self):
        """Initialize Gemini API client with current SDK patterns."""
        if not settings.gemini_api_key:
            self.logger.warning("GEMINI_API_KEY not configured - AI features will be disabled")
            return
        
        if settings.gemini_api_key == "dummy-key-for-testing":
            self.logger.info("Using dummy key for testing - AI features will be disabled")
            return
        
        try:
            # Configure the API key
            genai.configure(api_key=settings.gemini_api_key)
            
            # Create the generative model with modern configuration
            generation_config = genai.types.GenerationConfig(
                temperature=0.1,  # Low temperature for consistent planning
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
            
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
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini: {str(e)}")
            raise GeminiAPIError(f"Failed to configure Gemini: {str(e)}")
    
    def _get_serializable_tool_descriptions(self) -> Dict[str, Dict[str, Any]]:
        """Get tool descriptions in a JSON-serializable format."""
        try:
            raw_descriptions = get_tool_descriptions()
            serializable_tools = {}
            
            for name, desc in raw_descriptions.items():
                # Extract the actual values from any property objects
                tool_info = {
                    "name": name,
                    "description": str(desc.get("description", "")),
                    "parameters": {}
                }
                
                # Safely extract parameters
                if "parameters" in desc:
                    params = desc["parameters"]
                    if isinstance(params, dict):
                        tool_info["parameters"] = params
                    elif hasattr(params, '__dict__'):
                        tool_info["parameters"] = params.__dict__
                    else:
                        tool_info["parameters"] = str(params)
                
                serializable_tools[name] = tool_info
            
            return serializable_tools
            
        except Exception as e:
            self.logger.error(f"Error getting tool descriptions: {str(e)}")
            return {}
    
    def _create_system_prompt(self) -> str:
        """Create the system prompt for video processing workflow planning."""
        try:
            tools_json = json.dumps(self.tool_descriptions, indent=2, default=str)
        except Exception as e:
            self.logger.error(f"Error serializing tools: {str(e)}")
            tools_json = str(self.tool_descriptions)
        
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
        Analyze a user prompt and generate a workflow plan using the modern SDK.
        
        Args:
            prompt: User's natural language request
            video_metadata: Optional metadata about the video for context
            
        Returns:
            WorkflowPlan object with detailed execution plan
        """
        try:
            self.logger.info(f"Analyzing prompt with modern Gemini: {prompt}")
            
            # Check if Gemini model is initialized
            if self.model is None:
                raise GeminiAPIError("Gemini API not initialized. Please set GEMINI_API_KEY in your .env file")
            
            # Prepare video context safely
            video_context = "No metadata provided"
            if video_metadata:
                try:
                    # Handle different input types safely
                    if hasattr(video_metadata, 'model_dump'):
                        # Pydantic v2 model
                        metadata_dict = video_metadata.model_dump()
                    elif hasattr(video_metadata, 'dict'):
                        # Pydantic v1 model
                        metadata_dict = video_metadata.dict()
                    elif isinstance(video_metadata, dict):
                        # Already a dictionary
                        metadata_dict = video_metadata
                    else:
                        # Convert to dict if possible, otherwise use string representation
                        metadata_dict = video_metadata.__dict__ if hasattr(video_metadata, '__dict__') else str(video_metadata)
                    
                    video_context = json.dumps(metadata_dict, default=str, indent=2)
                except Exception as e:
                    self.logger.warning(f"Could not serialize video metadata: {e}")
                    video_context = str(video_metadata)
            
            # Create the user message
            user_message = f"""Please analyze this video editing request and create a workflow plan:

User Request: "{prompt}"

Video Context: {video_context}

Respond with a detailed JSON workflow plan using the available tools."""
            
            # Create chat session and get response using modern SDK
            chat = self.model.start_chat(history=[])
            
            # Send system prompt first
            system_response = chat.send_message(self._create_system_prompt())
            self.logger.debug("System prompt sent successfully")
            
            # Send user request and get response
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
            
            # Remove markdown code blocks
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            elif cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
                
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
        
        return warnings
    
    async def explain_workflow(self, workflow_plan: WorkflowPlan) -> str:
        """
        Generate a human-readable explanation of the workflow plan.
        
        Returns:
            Detailed explanation string
        """
        if self.model is None:
            return self._generate_basic_explanation(workflow_plan)
        
        try:
            explanation_prompt = f"""Please provide a clear, user-friendly explanation of this video processing workflow:

User Request: "{workflow_plan.prompt}"

Planned Steps: {len(workflow_plan.tool_sequence)} processing steps
- {chr(10).join([f"{i+1}. {tool.tool_name}: {tool.reasoning}" for i, tool in enumerate(workflow_plan.tool_sequence)])}

Estimated Time: {workflow_plan.estimated_time:.0f} seconds
Complexity: {workflow_plan.complexity_score}/5

Provide a friendly explanation that:
1. Summarizes what will be done to the video
2. Explains each processing step in simple terms
3. Sets appropriate expectations

Keep it conversational and easy to understand for non-technical users."""
            
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
