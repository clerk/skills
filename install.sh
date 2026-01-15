#!/bin/bash

# Clerk Skills Installer
# https://clerk.com/docs/ai
#
# Usage: curl -fsSL https://clerk.com/skills/install | bash
#    or: curl -fsSL https://raw.githubusercontent.com/clerk/skills/main/install.sh | bash

set -e

# Colors (only if stdout is a TTY)
if [ -t 1 ]; then
  GREEN='\033[32m'
  DIM='\033[2m'
  BLUE='\033[34m'
  RESET='\033[0m'
else
  GREEN=''
  DIM=''
  BLUE=''
  RESET=''
fi

REPO_URL="https://raw.githubusercontent.com/clerk/skills/main/plugins/clerk/skills"
INSTALLED=0

# Skills to install (task skills + reference skills)
SKILLS=("adding-auth" "customizing-auth-ui" "syncing-users" "testing-auth" "managing-orgs" "nextjs-patterns")

echo ""
echo "  ██████╗██╗     ███████╗██████╗ ██╗  ██╗"
echo " ██╔════╝██║     ██╔════╝██╔══██╗██║ ██╔╝"
echo " ██║     ██║     █████╗  ██████╔╝█████╔╝ "
echo " ██║     ██║     ██╔══╝  ██╔══██╗██╔═██╗ "
echo " ╚██████╗███████╗███████╗██║  ██║██║  ██╗"
echo "  ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝"
echo "           Skills Installer"
echo ""

# Claude Code
if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/skills/clerk"
  for skill in "${SKILLS[@]}"; do
    curl -sL -o "$HOME/.claude/skills/clerk/${skill}.md" "$REPO_URL/${skill}/SKILL.md"
  done
  printf "${GREEN}✓${RESET} Claude Code ${DIM}(~/.claude/skills/clerk/)${RESET}\n"
  INSTALLED=$((INSTALLED + 1))
fi

# Cursor (1.6+)
if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$HOME/.cursor/skills/clerk"
  for skill in "${SKILLS[@]}"; do
    curl -sL -o "$HOME/.cursor/skills/clerk/${skill}.md" "$REPO_URL/${skill}/SKILL.md"
  done
  printf "${GREEN}✓${RESET} Cursor ${DIM}(~/.cursor/skills/clerk/)${RESET}\n"
  INSTALLED=$((INSTALLED + 1))
fi

# OpenCode
if command -v opencode &> /dev/null || [ -d "$HOME/.config/opencode" ]; then
  mkdir -p "$HOME/.config/opencode/skills/clerk"
  for skill in "${SKILLS[@]}"; do
    curl -sL -o "$HOME/.config/opencode/skills/clerk/${skill}.md" "$REPO_URL/${skill}/SKILL.md"
  done
  printf "${GREEN}✓${RESET} OpenCode ${DIM}(~/.config/opencode/skills/clerk/)${RESET}\n"
  INSTALLED=$((INSTALLED + 1))
fi

# Windsurf - appends to global_rules.md
MARKER="# Clerk Skills"
if [ -d "$HOME/.codeium" ] || [ -d "$HOME/Library/Application Support/Windsurf" ]; then
  mkdir -p "$HOME/.codeium/windsurf/memories"
  RULES_FILE="$HOME/.codeium/windsurf/memories/global_rules.md"

  if [ -f "$RULES_FILE" ] && grep -q "$MARKER" "$RULES_FILE"; then
    printf "${GREEN}✓${RESET} Windsurf ${DIM}(already installed)${RESET}\n"
  else
    if [ -f "$RULES_FILE" ]; then
      echo "" >> "$RULES_FILE"
    fi
    echo "$MARKER" >> "$RULES_FILE"
    echo "" >> "$RULES_FILE"
    echo "When working with Clerk authentication, use these skills:" >> "$RULES_FILE"
    echo "" >> "$RULES_FILE"
    for skill in "${SKILLS[@]}"; do
      echo "## ${skill}" >> "$RULES_FILE"
      echo "" >> "$RULES_FILE"
      curl -sL "$REPO_URL/${skill}/SKILL.md" >> "$RULES_FILE"
      echo "" >> "$RULES_FILE"
    done
    printf "${GREEN}✓${RESET} Windsurf ${DIM}(~/.codeium/windsurf/memories/global_rules.md)${RESET}\n"
  fi
  INSTALLED=$((INSTALLED + 1))
fi

# Gemini CLI - uses TOML command format
if command -v gemini &> /dev/null || [ -d "$HOME/.gemini" ]; then
  mkdir -p "$HOME/.gemini/commands"
  TOML_FILE="$HOME/.gemini/commands/clerk-auth.toml"

  # Create TOML file with combined skills
  cat > "$TOML_FILE" << 'TOMLHEADER'
description = "Clerk authentication skills - manage users, organizations, and build Next.js apps"
prompt = """
# Clerk Authentication Skills

Use these skills when working with Clerk authentication.

TOMLHEADER

  for skill in "${SKILLS[@]}"; do
    echo "## ${skill}" >> "$TOML_FILE"
    echo "" >> "$TOML_FILE"
    # Download and strip frontmatter
    curl -sL "$REPO_URL/${skill}/SKILL.md" | sed '1,/^---$/d' | sed '1,/^---$/d' >> "$TOML_FILE"
    echo "" >> "$TOML_FILE"
  done

  echo '"""' >> "$TOML_FILE"

  printf "${GREEN}✓${RESET} Gemini CLI ${DIM}(~/.gemini/commands/clerk-auth.toml)${RESET}\n"
  INSTALLED=$((INSTALLED + 1))
fi

# Aider
if command -v aider &> /dev/null || [ -d "$HOME/.aider" ]; then
  mkdir -p "$HOME/.aider/skills/clerk"
  for skill in "${SKILLS[@]}"; do
    curl -sL -o "$HOME/.aider/skills/clerk/${skill}.md" "$REPO_URL/${skill}/SKILL.md"
  done
  printf "${GREEN}✓${RESET} Aider ${DIM}(~/.aider/skills/clerk/)${RESET}\n"
  INSTALLED=$((INSTALLED + 1))
fi

echo ""

if [ $INSTALLED -eq 0 ]; then
  echo "No supported AI coding agents detected."
  echo ""
  echo "Install one of these first:"
  echo "  - Claude Code: https://claude.ai/code"
  echo "  - Cursor: https://cursor.com"
  echo "  - OpenCode: https://opencode.ai"
  echo "  - Windsurf: https://codeium.com/windsurf"
  echo "  - Gemini CLI: https://github.com/google-gemini/gemini-cli"
  echo "  - Aider: https://aider.chat"
  echo ""
  echo "Or add AGENTS.md to your project manually:"
  echo "  curl -sL -o AGENTS.md $REPO_URL/AGENTS.md"
  exit 1
fi

echo "Done! Installed skills:"
for skill in "${SKILLS[@]}"; do
  printf "  ${BLUE}-${RESET} ${skill}\n"
done
echo ""
echo "Documentation: https://clerk.com/docs/ai"
echo ""
