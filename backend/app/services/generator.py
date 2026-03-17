import json
import os
import re

from openai import AsyncOpenAI


async def generate_test_cases(prompt: str) -> list[dict]:
    """Call the OpenAI API with the given prompt and return parsed test cases."""
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=4096,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": "You are a QA engineer. Return ONLY a valid JSON array with test cases. No markdown, no code blocks, no explanation, no extra text. Start with [ and end with ].",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    raw = response.choices[0].message.content

    # Strip whitespace and markdown fences
    cleaned = raw.strip()

    # Remove markdown code blocks (```json ... ``` or ``` ... ```)
    cleaned = re.sub(r"^```(?:json|yaml|python)?\s*\n?", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned, flags=re.MULTILINE)

    # Remove any leading/trailing whitespace again
    cleaned = cleaned.strip()

    # Extract JSON array if wrapped in extra text
    json_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)

    try:
        result = json.loads(cleaned)
        if not isinstance(result, list):
            raise ValueError("LLM response must be a JSON array")
        return result
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse LLM response as JSON: {str(e)[:100]}")


async def build_prompt(endpoint: dict) -> str:
    """Build a prompt for the LLM from an endpoint definition."""
    # TODO: implement prompt construction
    pass
