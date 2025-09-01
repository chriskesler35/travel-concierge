import { lazy, Suspense } from 'react';
import Layout from "./Layout.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Lazy load all page components
const Home = lazy(() => import("./Home"));
const DebugHome = lazy(() => import("./DebugHome"));
const Journeys = lazy(() => import("./Journeys"));
const Account = lazy(() => import("./Account"));
const JourneyDetails = lazy(() => import("./JourneyDetails"));
const TestPage = lazy(() => import("./TestPage"));
const AdminPanel = lazy(() => import("./AdminPanel"));
const AboutUs = lazy(() => import("./AboutUs"));
const Plan = lazy(() => import("./Plan"));
const AIAssistant = lazy(() => import("./AIAssistant"));
const Login = lazy(() => import("./Login"));
const SupabaseLogin = lazy(() => import("./SupabaseLogin"));
const DatabaseTest = lazy(() => import("./DatabaseTest"));

const PAGES = {
    
    Home: Home,
    
    Journeys: Journeys,
    
    Account: Account,
    
    JourneyDetails: JourneyDetails,
    
    TestPage: TestPage,
    
    AdminPanel: AdminPanel,
    
    AboutUs: AboutUs,
    
    Plan: Plan,
    
    AIAssistant: AIAssistant,
    
    Login: Login,
    
    SupabaseLogin: SupabaseLogin,
    
    DatabaseTest: DatabaseTest,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <Routes>            
                    
                        <Route path="/" element={<Home />} />
                        <Route path="/debug" element={<DebugHome />} />
                    
                    
                    <Route path="/Home" element={<Home />} />
                    
                    <Route path="/Journeys" element={<Journeys />} />
                    
                    <Route path="/Account" element={<Account />} />
                    
                    <Route path="/JourneyDetails" element={<JourneyDetails />} />
                    
                    <Route path="/TestPage" element={<TestPage />} />
                    
                    <Route path="/AdminPanel" element={<AdminPanel />} />
                    
                    <Route path="/AboutUs" element={<AboutUs />} />
                    
                    <Route path="/Plan" element={<Plan />} />
                    
                    <Route path="/AIAssistant" element={<AIAssistant />} />
                    
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/auth" element={<SupabaseLogin />} />
                    
                    <Route path="/database-test" element={<DatabaseTest />} />
                    
                </Routes>
            </Suspense>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}