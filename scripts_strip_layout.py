import re

with open("frontend/src/app/page.tsx", "r") as f:
    content = f.read()

# Remove Auth and layout checks
content = re.sub(r'if \(!mounted\) return null;\n\s*if \(!session\) return <Auth \/>;\n\n\s*if \(!orgId\) \{[\s\S]*?return \([\s\S]*?\}\n', '', content)

# Remove the sidebar and wrappers
content = re.sub(r'return \(\n\s*<div className="min-h-screen bg-zinc-50 flex text-zinc-900">\n\s*\{\/\* ── Sidebar Nav ── \*\/\}[\s\S]*?\{\/\* ── Main Content Area ── \*\/}[\s\S]*?\{\/\* Dashboard Grid \*\/\}', 'return (', content)

# Also remove trailing closing tags
content = content.replace('      </main>\n\n    </div>\n  );\n}', '  );\n}')

with open("frontend/src/app/page.tsx", "w") as f:
    f.write(content)
