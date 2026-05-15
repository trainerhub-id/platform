import { useState, useEffect } from 'react';
import api from 'src/api/axios';

// Agent images mapping
const agentImages: Record<string, string> = {
  'lesson-plan': '/src/assets/images/backgrounds/login-bg.jpg',
  'syllabus': '/src/assets/images/backgrounds/profile-bg.jpg',
  'assessment': '/src/assets/images/backgrounds/blog.jpg',
  'personal-branding': '/src/assets/images/backgrounds/profilebg.jpg',
  'content-assistant': '/src/assets/images/backgrounds/welcome-bg.png',
  'program-creator': '/src/assets/images/backgrounds/mega-dd-bg.jpg',
};

const adaptAgentToDocType = (agent: any) => {
  return {
    id: agent.type || agent.id,
    type: agent.type,
    title: agent.name,
    description: agent.description,
    image: agentImages[agent.type] || '/src/assets/images/backgrounds/login-bg.jpg',
    duration: '2-5 Menit',
    hasDraft: false,
    category: agent.category,
  };
};

export const useAiGenerator = () => {
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try the new Mastra agent endpoint first
        const res = await api.get('/ai/documents/agents');
        const agents = Array.isArray(res.data) ? res.data : [];
        setDocumentTypes(agents.map(adaptAgentToDocType));
        setLoading(false);
      } catch (err: any) {
        // Fallback to legacy endpoint if new one fails
        try {
          const res = await api.get('/ai/agents');
          const agents = Array.isArray(res.data) ? res.data : [];
          setDocumentTypes(agents.map(adaptAgentToDocType));
          setLoading(false);
        } catch (fallbackErr) {
          console.error('Error fetching AI agents:', err);
          setError(err.message || 'Failed to fetch agents');
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  return {
    documentTypes,
    loading,
    error,
  };
};
