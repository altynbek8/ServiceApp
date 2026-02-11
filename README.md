# ServiceApp - AI-Powered Service Marketplace


https://github.com/user-attachments/assets/059f3f77-2cd2-43e6-a4b3-df5cc3b184fa



A full-stack cross-platform mobile application built with **React Native** and **Supabase**. This project is a complex marketplace ecosystem that connects clients, individual specialists, and venues (businesses). It features an innovative AI-driven search engine and a real-time communication system.

> **Note:** The project was developed with a focus on high performance, clean architecture (file-based routing), and modern UI/UX trends.

## 🚀 Key Features

### 🤖 AI-Driven Search Engine
*   **Intent Analysis:** Integrated **Google Gemini AI** to analyze user search queries.
*   **Smart Filtering:** The AI extracts category, city, and price range from natural language (e.g., "Find a barber in Almaty under 5000 TG") to provide highly relevant results.

### 👥 Multi-Role Ecosystem
*   **Client App:** Browse categories, use AI search, book appointments, and leave reviews.
*   **Specialist App:** Manage a professional profile, portfolio (images/videos), and work schedule.
*   **Venue App:** Business-focused features for salons, shops, or restaurants with location-based services (Maps integration).

### ⚡ Real-time Features & Backend
*   **Instant Messaging:** Real-time personal and group (category-based) chats powered by **Supabase Realtime**.
*   **Booking System:** Complex scheduling logic with manual time blocking and automated status updates.
*   **Media Management:** Optimized media uploader with on-the-fly image compression and video thumbnail generation.
*   **Push Notifications:** Automated alerts for booking confirmations and new messages.

### 🎨 Premium UI/UX
*   **Deep Void Theme:** A custom-designed dark theme with neon accents for a modern look.
*   **Reels Feed:** A TikTok-style vertical video feed for specialists to showcase their work.
*   **Haptic Feedback:** Enhanced user interaction with tactile responses.

## 🛠 Tech Stack

*   **Frontend:** React Native (Expo), TypeScript.
*   **Navigation:** Expo Router (File-based routing).
*   **State & Auth:** Supabase Auth & Context API.
*   **Backend/Database:** Supabase (PostgreSQL) with Row Level Security (RLS).
*   **AI Integration:** Google Generative AI (Gemini SDK).
*   **Styling:** React Native Elements, Expo Linear Gradient.
*   **Storage:** Supabase Storage for high-res assets.

## 📂 Project Structure

```text
app/
├── (auth)/         # Authentication flow (Login, Register, Role Selection)
├── (client)/       # Client-side features (Home, AI Search, Booking)
├── (specialist)/   # Specialist dashboard (Schedule, Portfolio, Orders)
├── (venue)/        # Business/Venue management
├── chat/           # Real-time messaging implementation
├── lib/            # Shared utilities (Supabase client, AI logic, Uploader)
└── providers/      # Context providers (Auth, Theme)
```

## 🛠 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/altynbek8/ServiceApp.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_API_KEY=your_gemini_api_key
   ```
4. Start the development server:
   ```bash
   npx expo start
   ```

---

## 👨‍💻 Author
**Altynbek Temirkhan**  
