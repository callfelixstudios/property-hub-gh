# **Product Requirement Document (PRD)**

## **Project Title: PropertyHub GH**

* **Domain:** www.propertyhubgh.com  
* **Target Market:** Ghana (Renters, Buyers, Property Agents, and Real Estate Developers)  
* **Core Architecture:** Next.js (App Router), Tailwind CSS, Google Antigravity 2.0, Supabase Ecosystem (Auth, Database, Storage)

## **1\. Executive Summary & Core Mission**

Property Hub Ghana is a unified, high-performance property listing directory and marketplace built to eliminate the frustrating, high-friction process of renting rooms and acquiring land or homes in Ghana. The platform explicitly accommodates two distinct user intents under a single digital brand without confusing the audience:

1. **Renters:** Individuals looking for student hostels, single rooms, chamber and halls (self-contained), or multi-bedroom apartments.  
2. **Buyers:** Individuals or diaspora members looking for litigation-free plots of land, uncompleted structures, or completed estate homes.

## **2\. Core User Flow & Account Freedom**

* **Single Entryway Authentication:** The application features one single login page (/login) for every user. There are no confusing, rigid account type selections (Seeker vs. Agent) during registration.  
* **Fluid Platform Interaction:** Every registered user starts with the same capabilities. A user can search for a room to rent, and simultaneously click a button to post a property of their own if they have one available.  
* **Dynamic Role Evolution:** A user's account status automatically upgrades based on their activity and their subscription level.

## **3\. Landing Page UX & Navigation**

The homepage utilizes a stark, split visual architecture to ensure search accuracy at a glance.

* **Hero Message:** *"Welcome to the Hub. Find your next space in Ghana."*  
* **The Dual-Gateway Routing:** Two unmissable, equal-weighted navigation cards guide traffic immediately:  
  * **\[ Browse Spaces for Rent \]** $\\rightarrow$ Routes to the Rental Directory (Default filters: Hostels, Single Rooms, Chamber & Halls, Apartments).  
  * **\[ Browse Properties for Sale \]** $\\rightarrow$ Routes to the Purchase Directory (Default filters: Land Plots, Uncompleted Buildings, Complete Houses).

## **4\. Property Submission Form Specifications**

When any user clicks **\[ \+ Post a Space \]**, they are guided through a tailored, dynamic five-step wizard built explicitly for Ghanaian real estate nuances:

* **Step 1: Intent & Category:** User selects **Rent** or **Sale**, then picks the property type (Single Room, Chamber & Hall, Apartment, Student Hostel, Complete House, or Land).  
* **Step 2: Ghanaian Location Hierarchy:** Enforces a three-tier dropdown system (**Region** $\\rightarrow$ **City/Town** $\\rightarrow$ **Neighborhood/Area**), accompanied by an optional text box for local landmarks or proximity notes (e.g., *"5 minutes walk from the university roadside gate"*).  
* **Step 3: Pricing & Financial Terms:** \* A numeric field with a currency toggle (**GHS** default, **USD** option).  
  * A dynamic advance selection dropdown: *Per Month (1-year advance)*, *Per Month (2-years advance)*, *Per Academic Year* (for hostels), or *Outright Price* (for sales).  
  * A checkbox indicating if a separate utility service charge applies.  
* **Step 4: Pain-Point Specifications:** Checkboxes mapping crucial Ghanaian rental realities:  
  * Bathroom setup toggle: **\[ Private / Self-Contained \]** or **\[ Shared Bathroom \]**.  
  * Utility infrastructure: *Independent Prepaid Meter*, *Flowing Ghana Water*, *Fenced & Gated Compound*.  
* **Step 5: Media & Contact:** Drag-and-drop property image uploader, using the user's verified profile phone number for direct, one-click WhatsApp client conversations.

## **5\. Monetization & "The Soft Lock" Architecture**

The system employs a freemium model that is code-enforced but strategically adjusted for the launch phase.

### **5.1 Launch Phase Subscriptions (The Grandfather Promo)**

To bypass the chicken-and-egg directory problem at launch, high-volume account tiers are set to a cost of 0 GHS but marketed as a limited "Beta Founder Promo." This populates the database rapidly while setting expectations that code limits are an integral part of the system.

* **Hub Free Tier:** Allows a maximum of 2 active listings total. Standard search visibility. Free forever.  
* **Hub Premium Tiers (Promo Access):** Allows 10 to 30+ active listings, unlocking custom trust badges ("Verified Agent" or "Verified Developer").  
* **Immediate Revenue Driver:** Users can pay small, standalone transactional fees (via Mobile Money) to "Boost" or "Pin" a specific listing to the top of the homepage for 7 days, regardless of their subscription tier.

### **5.2 The Subscription Lapsing Protocol ("Soft Lock")**

If an agent uploads 50 properties during a paid month but fails to renew their subscription the following month:

* **No Data Deletion:** Existing properties remain live so seekers can still discover them, maintaining platform inventory.  
* **Creation Freeze:** The agent is completely blocked from adding a 51st property until they renew.  
* **Trust & Visibility Demotion:** The professional "Verified Agent" badge is instantly stripped from their profile, and all their listings are automatically pushed to the absolute bottom of search results.  
* **Automated Staleness Archive:** All listings carry a 30-day lifespan. If a lapsed user does not manually log in to refresh an old property, it automatically moves to a hidden archive status after 30 days to keep search results accurate.

## **6\. Admin Panel & Enterprise Security**

* **Role-Based Admin Access:** Administrative access is restricted to users whose account carries the platform_admin role in auth.users.app_metadata — no email-domain check.  
* **Airtight Security Verification:** Next.js middleware guards the /admin web path, throwing a 404 error to unauthorized users. Simultaneously, Supabase Row Level Security (RLS) policies block data reading or writing on admin tables unless the user's JWT carries the platform_admin role claim.

**Prompt 1: Database Schema & Security Architecture** 

/goal Establish the backend architecture and security infrastructure for Property Hub Ghana using Supabase.

1\. Create a relational profile table linked to Supabase Auth that defaults every user to a 'free' subscription tier, tracking name, phone number, and a verification boolean flag.

2\. Create a listings table storing: transaction type (RENT/SALE), property type (single\_room, chamber\_hall, apartment, hostel, land, house), price, currency, advance payment period, location hierarchy (region, city, neighborhood), landmark text, image URL arrays, and active/archive status flags.

3\. Write a database constraint or Row Level Security (RLS) policy that checks a user's active listing count: if their subscription tier is 'free', block any attempt to insert a third listing.

4\. Write an absolute RLS security rule for administrative tables that completely blocks all read, write, or modification privileges unless the authenticated user's JWT carries the platform_admin role claim.

**Prompt 2: Next.js Frontend Framework & Authentication** 

/goal Scaffold the core frontend architecture and routing system for Property Hub Ghana using Next.js App Router and Tailwind CSS.

1\. Build a single, unified login and registration page at '/login' utilizing Supabase server-side authentication.

2\. Create a post-registration step: the first time a user authenticates, show a clean onboarding screen that captures their profile name and primary WhatsApp number. Do not force them to pick a permanent role.

3\. Code a Next.js middleware file that intercepts requests to paths beginning with '/admin'. Read the user's active session; if the user lacks the platform_admin role, instantly return a 404 page, hiding the route entirely.

4\. Implement a responsive navbar that displays a universal '\[ \+ Post a Space \]' button, leading to a multi-step property upload wizard matching the PRD specifications.

### **Prompt 3: Split Landing Page & Search Directories**

/goal Build the responsive user interface and filtering engine for the dual-gateway directories.

1\. Construct the homepage hero layout displaying two prominent entry links: '\[ Browse Spaces for Rent \]' and '\[ Browse Properties for Sale \]'.

2\. The Rental link must route to a directory page that pre-filters the Supabase listings query to 'RENT' status, displaying search cards highlighting rental advance metrics, bathroom type (self-contained vs shared), and utilities.

3\. The Sale link must route to a directory page that pre-filters the database query to 'SALE' status, displaying search cards highlighting land dimensions, litigation status, and infrastructure.

4\. Add a one-click 'Chat on WhatsApp' button on every property detail card that deep-links directly to the poster's registered phone number with a pre-filled text query about that specific listing ID.

### **Prompt 4: The Subscription & "Soft Lock" Listing Controller**

/goal Create the dashboard controller logic managing the listing visibility and subscription lapses.

1\. Build an internal agent/user dashboard that counts active listings and shows their current tier status.

2\. Write a database query pipeline for the main search feeds that explicitly sorts listings by 'subscription\_tier' first, followed by 'is\_featured', and then by creation date. This ensures lapsed or free users are naturally deprioritized to the bottom of the feed.

3\. Create an archival cleanup worker or logic branch: if a listing.

**Google Antigravity Code Prompt: The Header Component** 

/goal Build a responsive, highly polished Navigation Header component for Property Hub Ghana according to the DESIGN.md style guide.

1\. Create a fixed-top single-row header with a background color of '\#ffffff', an 8px bottom boundary feel, and a very soft micro-shadow. 

2\. Left side: Display the brand logo 'Property Hub' in bold Deep Navy text.

3\. Center side: Place three spacious navigation links: 'Rentals', 'Sales', and 'SafeMove'. The 'SafeMove' link should feature a tiny, subtle 'New' badge using the Emerald Green Accent color. All links must use Inter or Plus Jakarta Sans typography.

4\. Right side: Implement a simple 'Login' ghost link followed by a high-visibility primary CTA button labeled '\[ \+ Post a Space \]'. The button must use a solid Safety Gold background, Deep Navy bold text, and an 8px border-radius.

5\. Ensure full mobile responsiveness: on smaller screens, collapse the center and right links into a clean, minimalist slide-out hamburger menu drawer.

## **PRD Appendix: Phase 2 Feature Addendum (SafeMove Mediation & Escrow)**

### **1\. Feature Objective**

To completely eradicate real estate transactional fraud in the Ghanaian market by acting as a trusted financial intermediary between seekers (renters/buyers) and listers (agents/developers). The platform will collect client funds, hold them securely, and release them only after successful move-in or verified land verification, charging a dynamic percentage mediation fee on successful transfers.

### **2\. User Experience Additions**

* **The Promotional Hook (Phase 1 Integration):** The global header contains a high-visibility navigation link titled **"SafeMove"** featuring a clean, Emerald Green accent badge marked *"New"*. In Phase 1, this navigates to a conversion-optimized static landing page detailing the upcoming secure escrow process, allowing users to join an early-access waitlist.  
* **The SafeMove Verification Checkbox (Phase 2 Upload):** When posting a listing, verified listers can check a box stating: *\[ \] "Accept SafeMove Escrow Protection"*. This gives their listing a specialized, high-conversion badge in search feeds, showing seekers they are 100% legitimate.

### **3\. Core Mediation Flow (The Escrow Pipeline)**

1. **Specification & Deposit:** A seeker selects an apartment or plot featuring the escrow badge, inputs their move-in date requirements, and deposits the advance payment into Property Hub Ghana’s centralized financial account (via integrated Mobile Money/Card gateways).  
2. **The Holding State:** The system holds the funds securely. The listing status updates dynamically to a locked transaction state, preventing other users from renting or buying the same property.  
3. **Move-In & Verification:** The renter inspects the space on the scheduled move-in day.  
   * **If Successful:** The renter clicks **\[ Confirm Release \]** on their dashboard, or the system auto-releases the funds after a 48-hour clear window, transferring the payout to the agent's MoMo wallet minus a 3%–5% platform mediation fee.  
   * **If Fraudulent/Dispute:** The renter clicks **\[ Dispute Transaction \]**. The funds remain locked, and the platform admin intervenes via the dashboard to verify the claim and issue a full refund to the seeker if the agent defaulted.

### **4\. Technical Infrastructure (Supabase Layer Enhancements)**

To ensure Phase 1 is built ready for Phase 2, the following flat architectural modifications are noted for the database:

* **Listings Table Expansion:** Includes a boolean field `allows_escrow` defaulting to false, and a `transaction_lock_status` tracking whether a property is actively under deposit hold.  
* **Escrow Ledger Table (Phase 2 Insert):** A relational table mapping `listing_id`, `seeker_id`, `lister_id`, `escrow_amount`, `mediation_fee_deducted`, and `dispute_status` strings (*pending*, *released*, *disputed*, *refunded*).

