🏠 HomeHub - Master PRD (v2.0)
🎯 Vision
A shared home management application designed to reduce Cognitive Load. The system focuses on visual serenity, smart automation, and rapid actions, making home administration feel light, intuitive, and effortless.

📖 Glossary of Terms
To ensure consistency across the system, the following terms are defined:

Home Hub: The root level (Dashboard) containing all activity domains.

Hub: A top-level category (e.g., "Shopping & Gear", "Home Tasks").

Sub-Hub: A specific list instance (e.g., "Supermarket", "Camping trip").

Context: The identified topic of a Sub-Hub based on its name (e.g., Travel, Grocery).

Mapping: The lookup table connecting Context to a list of Master Items.

Bubbles: Interactive UI elements (buttons) that trigger the injection of a "Starter Pack" into the Master List.

Master List: The "source of truth" for a Sub-Hub. Items here are templates that can be toggled into the Active List.

Active List: The list of items currently "needed" or "in-progress" for the user's current session.

List-Category: The internal grouping labels within a list (e.g., Dairy, Documents & Money). Every item belongs to one Category.

🏗️ System Architecture (Hierarchy)
The application is built on three clear hierarchical layers:

Level 1: Home Hub (Parent Hubs): The main dashboard featuring "Parent Cards" grouped by activity domains.

Examples: Shopping & Gear, Home Tasks, Vouchers.

Level 2: Sub-Hubs (The Destination): Specific lists within each Hub.

Examples: Under "Shopping", you'll find Supermarket, Pharma, Camping. Under "Vouchers", you'll find Concert Tickets.

Level 3: Operational Layer:

Master List (The Blueprint): The permanent item database for each Sub-Hub.

Active List (The Engine): The dynamic execution list (what needs to be bought/packed right now).

✨ Core Features
🚀 Smart Context Recognition & Bubbles
A smart mechanism that identifies the list's topic and suggests relevant content:

Context Engine: The system scans the Sub-Hub name for specific Keywords.

Smart Suggestions (Bubbles): When opening a new Sub-Hub, transparent "Bubbles" appear in the center of the screen:

Suggestion Bubbles: Clicking these automatically injects a "Starter Pack" into the Master List (e.g., "Camping" -> Tent, Flashlight, Stove).

"Keep Empty" Bubble: For manual editing from scratch (styled with a dashed border).

Smart Merge: Clicking multiple bubbles sequentially adds all relevant items without duplicates.

🧠 Flexible Memory (Long-term Persistence)
The system persists the Master List in localStorage based on its Context.

Similar names (e.g., "Stock" and "Home Stock") share the same Master List, ensuring updates in one reflect in the other.

🛒 Intelligent List Management
Automatic Sorting (List-Categories): Items are visually grouped into categories (e.g., Dairy, Pantry, and a specialized category: Documents & Money).

Duplicate Prevention: Alerts or blocks items that already exist (Case-insensitive).

Dynamic Ordering: Active items remain at the top; Checked items move to the bottom of their respective categories.

🛠️ Bulk Actions
Bulk Delete Mode: Multi-selection mode for rapid item removal from either the Master or Active lists.

Select All & Clear All: Quick tools to empty the Active List or select all items for batch processing.

🎨 Visual Language (The Vibe)
Style: Clean, Flat Design, Minimalist.

Color Palette:

Primary: Deep Burgundy (#630606) – Headers, primary actions, and icons.

Secondary: Taupe/Cream (#F5F2E7) – Backgrounds and surfaces.

Bubbles Style: Burgundy background with 10% transparency, thin burgundy border. "Keep Empty" bubble features a dashed border.

Motion: Subtle animations (duration-300) to ensure smooth transitions without jarring visual jumps.

🛠️ Tech Stack
Frontend: React (Vite) + TypeScript.

Styling: Tailwind CSS.

Persistence: LocalStorage (Context-based keys).

Architecture: Component-based (src/components/) to ensure scalability.

🎟️ Vouchers & Reservations Hub (The "Digital Wallet")
A unified space for home assets (Vouchers) and scheduled events (Reservations).

Polymorphic Data Model:
All items in this hub extend BaseItem but are categorized into two distinct types:

Voucher Type: For monetary assets like Gift Cards and store credit.

Unique Fields: value (amount), issuer (provider), expiryDate, code/barcode.

Reservation Type: For time-bound events like restaurant bookings or shows.

Unique Fields: eventDate (replaces expiry), time, address.

Common Fields: id, name, imageUrl, notes.

UI - Smart Card Rendering:
The Grid View adapts its display based on the item type to minimize clicks:

Voucher Cards: Display Name, Value (e.g., ₪500), and Expiry Date prominently on the card.

Reservation Cards: Display Name, Event Date/Time, and Address directly on the card for quick reference.

Deep Access (Option A): All cards feature a "Photo" icon (if an image is attached) and a "Copy/Link" icon. Full details and the original screenshot are accessible via a Modal view.

Smart Creation & Templates:
When creating a new Sub-Hub, the system maps it to a default type:

Reservation Templates: Ontopo, Movies & Shows.

Voucher Templates: BuyMe, Shopping Vouchers, Digital Cards, Physical Cards.

Custom Hubs: User selects type via Radio Buttons during creation.

Data Entry Automation:

Smart Paste: Detects URLs (buyme/ontopo) to auto-fill fields and select the correct item type.

Screenshot OCR: Scans uploaded images for voucher codes and values to auto-populate the form.
----------

🚀 Future Roadmap (Post-MVP)

Automated Billing Hub (Gmail Integration): * Developing a dedicated "Bills" Sub-Hub that syncs with the user's Gmail API.

Automatically extracting due dates and amounts from utility/service provider emails and displaying a preview of the bill directly within the task.

Enhanced Navigation ("Flashlight" Mode): * Improving the Deep-Link experience: when redirecting from the Urgent Sub-Hub, the target task will not only be displayed but also highlighted visually (pulsing border or background) to help the user find it immediately in a long list.

Smart Price Comparison (Supermarket Sync):

Integrating a price-comparison engine within the Shopping Hub.

Connecting items to local supermarket databases/APIs to show real-time price totals and help the user choose the cheapest store for their current list.

Multi-User Collaboration & Push Notifications:

Implementing a shared-hub model with real-time updates.

Adding Push Notifications to alert users when a task is completed, a new item is added, or when a "High Urgency" task is approaching its deadline.





Cloud Sync & Persistent Database (Post-MVP):

Transition from LocalStorage: Migrating the data layer from client-side storage to a cloud-based Database-as-a-Service (e.g., Firebase, Supabase, or MongoDB Atlas).

Real-time Synchronization: Implementing WebSockets or Real-time listeners to ensure that updates (new shopping items, task completions, or voucher additions) reflect instantly across all connected devices in the household.

User Authentication: Adding a secure login system (Google Auth / Magic Links) to associate data with a specific household ID.

Image Hosting: Moving Base64 images from LocalStorage to a dedicated Storage Bucket (S3/Firebase Storage) to handle high-resolution photos of vouchers without performance degradation.