import Layout from "./Layout.jsx";

import Home from "./Home";

import Journeys from "./Journeys";

import Account from "./Account";

import JourneyDetails from "./JourneyDetails";

import TestPage from "./TestPage";

import AdminPanel from "./AdminPanel";

import AboutUs from "./AboutUs";

import Plan from "./Plan";

import AIAssistant from "./AIAssistant";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Journeys" element={<Journeys />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/JourneyDetails" element={<JourneyDetails />} />
                
                <Route path="/TestPage" element={<TestPage />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/AboutUs" element={<AboutUs />} />
                
                <Route path="/Plan" element={<Plan />} />
                
                <Route path="/AIAssistant" element={<AIAssistant />} />
                
            </Routes>
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