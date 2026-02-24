KrownFrame: Architectural Overview
KrownFrame is a specialized terminal interface designed for Warframe operators, providing real-time data integration, advanced combat calculations, and persistent session management. The system is built using a modern full-stack architecture to ensure high performance and reliability.

Core Technical Features
Real-Time Data Synchronization: The interface establishes a stable connection to external game state APIs to monitor active mission cycles, including Cetus, Orb Vallis, and the Cambion Drift.

The Simulacrum (Combat Logic): An integrated Effective Health Pool (EHP) calculator that processes complex combat variables such as base health, armor-based damage reduction, and additional mitigation percentages to provide precise survivability metrics.

Persistent Session Protocol: Utilizes local storage mechanisms to preserve chat history and mastery rank configurations across browser refreshes, ensuring a seamless user experience.

The Vault (Data Encoding): Implements a URL-based sharing system where complex build configurations are serialized into Base64 strings, allowing for instant data transfer via query parameters.

Bulletproof Proxy Architecture: Employs a dedicated server-side API route to act as a bridge for data fetching, effectively bypassing client-side security restrictions and network instability.

Technical Stack
Framework: Next.js with React for efficient server-side rendering and client-side interactivity.

Styling: Tailwind CSS for a high-fidelity, responsive terminal aesthetic.

Typography: Integrated Poppins font for optimal readability in data-dense environments.

Icons: Lucide-React for clear, functional iconography across the dashboard.

Content Rendering: React-Markdown for dynamic processing of system messages and technical documentation.

Security and Deployment
Environment Configuration: Sensitive keys and system parameters are managed through encrypted environment variables.

Cross-Platform Compatibility: Optimized for both high-resolution desktop displays and mobile hardware, utilizing flexible layout logic to maintain architectural integrity across devices.
