#!/bin/bash

# HomeHub Agent Terminal Setup for iTerm2
# Run this script once — it creates 5 tabs with agent identity

# Color palette — dark, pleasant backgrounds that are easy on the eyes
# Each color is distinct but cohesive (dark tones with subtle hue shifts)

declare -A AGENTS
declare -A COLORS
declare -A EMOJIS

AGENTS[1]="COORDINATOR"
AGENTS[2]="ARCHITECT"
AGENTS[3]="FRONTEND"
AGENTS[4]="BACKEND"
AGENTS[5]="QA"

# Dark backgrounds with subtle color tints
COLORS[1]="2d2a1e"  # Warm dark khaki (Coordinator)
COLORS[2]="1a1a2e"  # Deep navy (Architect)
COLORS[3]="2e1a2e"  # Deep plum (Frontend)
COLORS[4]="1a2e2e"  # Deep teal (Backend)
COLORS[5]="1a2e1a"  # Deep forest (QA)

EMOJIS[1]="🎯"
EMOJIS[2]="🏗️"
EMOJIS[3]="🎨"
EMOJIS[4]="⚙️"
EMOJIS[5]="🧪"

setup_tab() {
    local idx=$1
    local name="${EMOJIS[$idx]} ${AGENTS[$idx]}"
    local color="${COLORS[$idx]}"
    echo -e "\033]1337;SetColors=bg=${color}\a"
    printf "\x1b]1;${name}\x07"
    echo ""
    echo "  ═══════════════════════════════════════"
    echo "  ${name} TERMINAL"
    echo "  ═══════════════════════════════════════"
    echo ""
}

case ${1:-} in
    coordinator|1) setup_tab 1 ;;
    architect|2)   setup_tab 2 ;;
    frontend|3)    setup_tab 3 ;;
    backend|4)     setup_tab 4 ;;
    qa|5)          setup_tab 5 ;;
    *)
        echo "Usage: source ./agent-tabs.sh [coordinator|architect|frontend|backend|qa]"
        ;;
esac