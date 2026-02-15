# 📋 Project Backlog & Bug Tracker

## 🐞 Bugs to Fix
*List of technical issues and glitches found during testing.*

None at the moment!

## Context Bugs & Enhancements

None at the moment!


## 🛠️ Minor Enhancements
*Small UI/UX improvements that are not critical bugs.*

None at the moment!

## 🚀 Future Features (Post-MVP)
*Long-term ideas from the PRD roadmap.*

- [ ] Gmail integration for Bill automation. + vouchers
- [ ] Price comparison engine for supermarkets.
- [ ] Push notifications for hub users.
- [ ] Urgent task reminder button - if theres an Asignee, bell icon that suggest "Remind <Asignee> about the task?" > push notification to the asignee.
- [ ] Google calender itegration -> show "Today" and "Tomorrow" at the top of the main screen.
- [ ] Whatsapp integration - create a whatsapp group with the relevant users of HomeHub. this group will be the basis of communication about frequent changes in the subhubs. Ideally, a user can write down things there that will eventually be shown in the app itself e.g. "buy bananas" will add "bananas" to groceries list automatically.
- [ ] Hebrew support
- identify the username to welcome in the main screen
---
## ✅ Completed
*Moved here after verification.*
- [x] Hierarchical ID logic implementation.
- [x] Initial Home Tasks Hub & Urgent Aggregation.
- [x] **Shopping Hub:** "Baby Shampoo" incorrectly categorized under "Meat" - Fixed by reordering autoCategorize to check 'Pharma & Hygiene' before 'Meat' and adding baby-specific keywords.
- [x] **Shopping Hub:** "Vacation" SubHub suggested incorrect contexts - Fixed by implementing word boundary matching for more precise context detection.
- [x] **Shopping Hub:** MasterList suggestions disappeared after selecting one - Fixed by keeping suggestions visible in a separate section for list merging.
- [x] **Home Tasks:** Urgent Tasks checkbox was disabled - Fixed by enabling checkbox and implementing source sub-hub update logic for urgent tasks.
- [x] **Context Enhancement** - Expanded all 12 context categories to have 15+ keywords and 20 items each. Improved recognition for grocery keywords (walmart, target, food, weekly shop, safeway) and added comprehensive items across all categories.
- [x] **Vacation Context Bug** - Fixed "Vacation" only suggesting "travel abroad" by adding 'vacation' keyword to camping context. Now shows BOTH Camping and Travel Abroad suggestions.
- [x] **Header Buttons** - Moved "+ New List" button from grid layout to page headers in both Shopping Hub and Tasks Hub for better accessibility and discoverability.
- [x] **Deep Link Flashlight Effect** - Implemented visual highlight animation when navigating from Urgent Tasks to source task. Task scrolls into view and pulses with glowing effect for 3 seconds.
- [x] **UI Spacing** - Improved spacing between columns in Home Tasks from gap-4 to gap-6 for better readability.
- [x] **Clear Completed Tasks** - Added "Clear Completed" button in Task Hub header to quickly delete all completed tasks with confirmation modal showing count.
- [x] **Quick Add Templates Minimizer** - Added collapsible section to Quick Add from Templates in Master List Drawer with animated chevron icon.