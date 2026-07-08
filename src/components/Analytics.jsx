import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Analytics = ({ tasks }) => {
  const data = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    const shapeCount = {};
    const statusCount = { active: 0, completed: 0, sold: 0, returned: 0 };

    tasks.forEach(t => {
      statusCount[t.status || 'active']++;
      
      if (t.status === 'sold') {
        t.stones?.forEach(s => {
          const buy = parseFloat(s.buyPrice) || 0;
          const sell = parseFloat(s.sellPrice) || 0;
          totalRevenue += sell;
          totalProfit += (sell - buy);
          
          if (s.shape) {
            shapeCount[s.shape] = (shapeCount[s.shape] || 0) + 1;
          }
        });
      }
    });

    const shapeData = Object.keys(shapeCount).map(k => ({ name: k, value: shapeCount[k] }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const performanceData = [
      { name: 'Revenue', value: totalRevenue, fill: '#3b82f6' },
      { name: 'Profit', value: totalProfit, fill: '#10b981' }
    ];

    return { shapeData, COLORS, performanceData, statusCount };
  }, [tasks]);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Performance Overview</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.performanceData}>
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Sold Shapes Distribution</h2>
        {data.shapeData.length > 0 ? (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.shapeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.shapeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={data.COLORS[index % data.COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sold diamonds yet.</div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
