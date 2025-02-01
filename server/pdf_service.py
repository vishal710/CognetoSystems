import flask
from flask import Flask, request, jsonify
from pypdf import PdfReader
from io import BytesIO
import anthropic
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

def get_prompt_template(name):
    try:
        conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT prompt 
                FROM prompt_templates 
                WHERE name = %s AND is_active = true 
                ORDER BY created_at DESC 
                LIMIT 1
                """,
                (name,)
            )
            result = cur.fetchone()
            if result:
                return result['prompt']
            raise Exception(f"No active prompt template found for {name}")
    except Exception as e:
        print(f"[ERROR] Failed to fetch prompt template: {str(e)}")
        raise
    finally:
        if conn:
            conn.close()

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    try:
        print("[DEBUG] Starting PDF analysis...")
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file uploaded'}), 400

        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        print(f"[DEBUG] Processing PDF file: {pdf_file.filename}")
        # Read PDF content
        pdf_bytes = BytesIO(pdf_file.read())
        pdf_reader = PdfReader(pdf_bytes)
        text_content = ""

        print("[DEBUG] Extracting text from PDF...")
        for page in pdf_reader.pages:
            text_content += page.extract_text()

        print(f"[DEBUG] Extracted text length: {len(text_content)} characters")
        if not text_content.strip():
            return jsonify({'error': 'No text content found in PDF'}), 400

        # Initialize Anthropic client
        try:
            api_key = os.environ.get('ANTHROPIC_API_KEY')
            if not api_key:
                print("[ERROR] Anthropic API key not found in environment")
                return jsonify({'error': 'Anthropic API key not found'}), 500

            print("[DEBUG] Initializing Anthropic client...")
            client = anthropic.Anthropic(api_key=api_key)

            system_prompt = """You are a document analysis assistant. Your task is to analyze documents and provide structured information.
            Always respond with a valid JSON object containing exactly these fields:
            - summary: A concise summary of the key points
            - riskRating: A number between 1 and 5 (1=lowest risk and 5 is highest risk)
            - additionalInfo: An array of strings with important notes

            Format your response as a JSON object with the following structure:
            {
                "summary": "string",
                "riskRating": number,
                "additionalInfo": ["string"]
            }

            Format your entire response as a JSON object. Do not include any other text."""

            user_prompt = f"Analyze this document and provide the results in JSON format:\n\n{text_content}"

            print("[DEBUG] Sending request to Anthropic API...")
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            print("[DEBUG] Received response from Anthropic")
            print(f"[DEBUG] Response structure: {response}")

            # Extract the text content from the response
            if not hasattr(response, 'content') or not response.content:
                raise ValueError("Empty response from Anthropic API")

            content_block = response.content[0]
            if not hasattr(content_block, 'text'):
                print(f"[ERROR] Unexpected response format: {content_block}")
                raise ValueError("Unexpected response format - no text field")

            result = content_block.text
            print(f"[DEBUG] Raw response text: {result}")

            try:
                # Parse and validate JSON response
                parsed_result = json.loads(result)
                print("[DEBUG] Successfully parsed JSON response")

                required_fields = {"summary", "riskRating", "additionalInfo"}
                missing = required_fields - set(parsed_result.keys())
                if missing:
                    raise ValueError(f"Missing required fields: {missing}")

                # Validate riskRating
                risk_rating = float(parsed_result["riskRating"])
                if not (1 <= risk_rating <= 5):
                    raise ValueError(f"Risk rating {risk_rating} is not between 1 and 5")

                # Validate additionalInfo is a list
                if not isinstance(parsed_result["additionalInfo"], list):
                    raise ValueError("additionalInfo must be an array")

                print("[DEBUG] Validation successful, returning result")
                return jsonify(parsed_result)

            except json.JSONDecodeError as je:
                print(f"[ERROR] JSON parsing error: {str(je)}")
                print(f"[ERROR] Raw response was: {result}")
                return jsonify({'error': 'Failed to parse AI response'}), 500
            except ValueError as ve:
                print(f"[ERROR] Validation error: {str(ve)}")
                print(f"[ERROR] Raw response was: {result}")
                return jsonify({'error': str(ve)}), 500

        except anthropic.APIError as ae:
            print(f"[ERROR] Anthropic API error: {str(ae)}")
            return jsonify({'error': f'AI service error: {str(ae)}'}), 500
        except Exception as e:
            print(f"[ERROR] Unexpected error during API call: {str(e)}")
            return jsonify({'error': str(e)}), 500

    except Exception as e:
        print(f"[ERROR] Unexpected error in analyze_pdf: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)