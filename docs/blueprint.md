# **App Name**: Jalan Blambangan ku

## Core Features:

- Road Damage Reporting: Capture and upload images of damaged roads with coordinate data to local storage. The location data will be stored and shared with other modules. Add camera start and close button in report page, so there is no upload image button
- Interactive Map Display: Display road damage reports on a map using Leaflet and OpenStreetMap data. Each damage report will appear as a marker.
- Detailed Report View: Upon selecting a road damage report from the map or dashboard, show detailed information in a sidebar, including images, coordinates, random damage status (3 levels), and a repair status selector.
- District-wide Status Overview: Present a district-wide overview of road conditions on a continuously visible left sidebar.
- Login System: Implement a basic login system (admin/user), without a database. Store session using browser local storage
- Admin Dashboard: Dashboard viewable by admin that visualizes all submitted reports. In the admin dashboard map, depending on the number of reports taken in a road area, the road color will change from green to red.

## Style Guidelines:

- Primary color: Strong blue (#2962FF) evoking trust and stability, aligned with government services.
- Background color: Light gray (#F5F5F5), providing a neutral backdrop.
- Accent color: Analogous cyan (#40D4BB), for interactive elements and highlighting key data.
- Body and headline font: 'Inter' (sans-serif) for a modern, clear, and accessible reading experience.
- Use material design icons to represent road conditions and repair status, to create intuitive and scannable information.
- Responsive design that adapts to various screen sizes, maintaining usability on both desktop and mobile devices.
- Subtle transitions for map updates and report details to enhance user experience without being distracting.