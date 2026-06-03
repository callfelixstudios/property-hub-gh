## **📐 Designing the Landing Page Layout**

Following your strict `DESIGN.md` tokens (Deep Navy, Emerald Green, Safety Gold, and minimalist micro-shadows on `#f7f9fb`), we need to build a striking, zero-clutter entryway. We will split the layout into four high-impact blocks:

### **Block 1: The Hero Section (Above the Fold)**

* **Background:** Crisp, clean `#ffffff` or `#f7f9fb` with generous breathing room.  
* **Headline:** *"Secure Your Next Space in Ghana."* (Heavyweight, bold Deep Navy text).  
* **Subheadline:** *"Verified listings, transparent terms, and zero agent duplication. Search rentals and properties for sale across Accra, Kumasi, and beyond."*  
* **The Search Bar Layout:** Rather than a clumsy generic search bar, it's a sleek, unified card with two macro-tabs sitting right on top: **\[ Renting \]** and **\[ Buying \]**. Underneath the active tab, a clean single-line input field lets them type an area or neighborhood (e.g., *"East Legon"*, *"Ayeduase"*).

### **Block 2: The Dual-Gateway Core (The Choice)**

Directly below the hero, we place two equal-weighted, massive visual cards side-by-side to route intentional traffic instantly.

\+-----------------------------------+   \+-----------------------------------+  
|      \[ Browse Spaces for Rent \]   |   |     \[ Browse Spaces for Sale \]    |  
|                                   |   |                                   |  
|  \- Student Hostels & Single Rooms |   |  \- Litigation-Free Land Plots     |  
|  \- Chamber & Halls / Apartments   |   |  \- Uncompleted & Complete Estates |  
|                                   |   |                                   |  
|  \[ View Rentals \-\> (Navy Button)\] |   |  \[ View Sales \-\> (Navy Button) \]  |  
\+-----------------------------------+   \+-----------------------------------+

### **Block 3: The "SafeMove" Value Proposition (Trust Builder)**

Before they even look at listings, we need to address the elephant in the room: **trust**.

* A clean, wide horizontal banner introducing **SafeMove**.  
* **The Copy:** *"Tired of fake agents and double-rented apartments? Look for the SafeMove badge. We hold your rent advance securely in escrow and only release it to the lister after you successfully move in."*  
* **CTA Button:** A ghost-style button with a 1px Navy border reading: *"How SafeMove Protects You."*

### **Block 4: The Dynamic "Freshly Added" Grid**

A grid of the 6 newest properties matching your exact component specification:

* **Image Ratio:** 3:2 aspect ratio cards with an `Emerald Green` "New" badge or `Safety Gold` "Verified Agent" badge floating in the top left.  
* **Pricing:** Deep Navy bold typography showing the pricing and terms cleanly (e.g., *₵4,500 / Month (1-Year Advance)*).  
* **Action:** A high-visibility button right on the card for instant connection.

## **🚀 Google Antigravity Code Prompt: The Landing Page Component**

Go to your Antigravity workspace chat, copy and paste this command to have it generate and live-deploy this page directly to your Vercel URL:

Plaintext  
/goal Build the responsive homepage index path ('src/app/page.tsx') for Property Hub Ghana using Tailwind CSS, adhering strictly to DESIGN.md and PRD.md.

1\. Implement Block 1 (Hero): Create a spacious layout with the headline 'Secure Your Next Space in Ghana' in bold Deep Navy. Add a centered search widget featuring clean macro-tabs for 'Renting' and 'Buying' with an auto-focus neighborhood search input field.  
2\. Implement Block 2 (Dual-Gateway Cards): Build two side-by-side responsive container cards mapping 'Browse Spaces for Rent' and 'Browse Spaces for Sale' with explicit property sub-type lists. Use a micro-shadow on surface-lowest containers with an 8px border-radius.  
3\. Implement Block 3 (SafeMove Banner): Construct a full-width section with an Emerald Green accent element introducing the SafeMove escrow framework, utilizing a secondary ghost-style CTA button.  
4\. Implement Block 4 (Featured Feed): Scaffold a grid displaying 6 property card skeletons. Each card must map a 3:2 image placeholder, a floating trust badge in the top-left corner, Deep Navy pricing text, and a Safety Gold primary conversion button.

