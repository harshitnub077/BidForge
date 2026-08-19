from markitdown import MarkItDown
import sys

try:
    md = MarkItDown()
    result = md.convert('/Users/harshitru/.gemini/antigravity-ide/brain/e4038eea-3899-4df4-8e62-4f643b5d358d/.user_uploaded/media_1787134573270.pdf')
    print("SUCCESS")
    print(result.text_content[:200])
except Exception as e:
    print(f"FAILED: {str(e)}")
