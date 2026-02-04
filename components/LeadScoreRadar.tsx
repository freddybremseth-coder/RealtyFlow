
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { COLORS } from '../constants';

interface LeadScoreRadarProps {
  sentiment: number;
  urgency: number;
  intent: number;
  engagement?: number;
}

const LeadScoreRadar: React.FC<LeadScoreRadarProps> = ({ sentiment, urgency, intent, engagement = 70 }) => {
  const data = [
    { subject: 'Sentiment', A: sentiment, fullMark: 100 },
    { subject: 'Urgency', A: urgency, fullMark: 100 },
    { subject: 'Intent', A: intent, fullMark: 100 },
    { subject: 'Engagement', A: engagement, fullMark: 100 },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Lead Score"
            dataKey="A"
            stroke={COLORS.primary}
            fill={COLORS.primary}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeadScoreRadar;
