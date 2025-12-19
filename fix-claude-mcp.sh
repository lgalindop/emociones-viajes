#!/bin/bash

# Fix for Claude Desktop MCP filesystem connection dropping
# This creates a wrapper script that properly loads nvm environment

echo "Creating npx wrapper for Claude Desktop..."

# Create wrapper script
cat > ~/npx-for-claude << 'EOF'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
exec npx "$@"
EOF

chmod +x ~/npx-for-claude

echo "✅ Wrapper created at ~/npx-for-claude"
echo ""
echo "Now update your Claude Desktop config:"
echo ""
echo "Location: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "Change from:"
echo '{'
echo '  "mcpServers": {'
echo '    "filesystem": {'
echo '      "command": "npx",'
echo '      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "To:"
echo '{'
echo '  "mcpServers": {'
echo '    "filesystem": {'
echo '      "command": "'$HOME'/npx-for-claude",'
echo '      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/luis.galindo/Coding/proyectos-dev/emociones-viajes"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "After updating, FORCE QUIT Claude Desktop (Activity Monitor) and restart."
