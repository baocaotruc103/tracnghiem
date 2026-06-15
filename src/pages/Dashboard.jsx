import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Trophy, LogOut, Play } from 'lucide-react';

export default function Dashboard({ session, setSession }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ usersCount: 0, testsCount: 0 });
  const [top10, setTop10] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Lấy tổng user từ bảng users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 2. Lấy tổng lượt làm bài
      const { count: testsCount } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true });

      setStats({ usersCount: usersCount || 0, testsCount: testsCount || 0 });

      // 3. Lấy Top 10 (Join với bảng users)
      const { data: top10Data } = await supabase
        .from('test_attempts')
        .select('*, users(ho_ten, ten_dang_nhap)')
        .order('score', { ascending: false })
        .limit(10);
      
      if (top10Data) setTop10(top10Data);

      // 4. Lấy lịch sử cá nhân
      const { data: historyData } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', session.id)
        .order('created_at', { ascending: false });

      if (historyData) setHistory(historyData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quiz_user');
    setSession(null);
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{minHeight: '100vh'}}>Loading Dashboard...</div>;
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="flex justify-between items-center mb-8 mobile-header-stack">
        <div>
          <h1 className="text-h1 mb-0">Tổng Quan</h1>
          <p className="text-muted">Chào mừng trở lại, {session.full_name || session.username}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
          <LogOut size={18}/> Đăng xuất
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="glass-panel stat-card">
          <Users size={32} color="var(--primary)" />
          <h3 className="text-h3 mt-4 text-muted">Lượt đăng ký</h3>
          <div className="stat-value">{stats.usersCount}</div>
        </div>
        
        <div className="glass-panel stat-card">
          <BookOpen size={32} color="var(--success)" />
          <h3 className="text-h3 mt-4 text-muted">Lượt làm bài</h3>
          <div className="stat-value">{stats.testsCount}</div>
        </div>

        <div className="glass-panel flex flex-col items-center justify-center text-center p-4">
          <button 
            onClick={() => navigate('/test')} 
            className="btn-primary" 
            style={{ fontSize: '1.2rem', padding: '16px 24px', width: '100%', height: '100%' }}
          >
            <Play size={24} fill="currentColor" /> Vào Thi Ngay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel">
          <h2 className="text-h2 flex items-center gap-2 mb-6">
            <Trophy color="gold" /> Top 10 Bảng Xếp Hạng
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Người Chơi</th>
                  <th>Điểm</th>
                  <th>Ngày Thi</th>
                </tr>
              </thead>
              <tbody>
                {top10.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted">Chưa có dữ liệu</td></tr>
                )}
                {top10.map((attempt, index) => (
                  <tr key={attempt.id}>
                    <td>
                      <span className={`badge ${index === 0 ? 'badge-primary' : 'badge-success'}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>{attempt.users?.ho_ten || attempt.users?.ten_dang_nhap || 'Ẩn danh'}</td>
                    <td className="font-bold text-primary">{attempt.score}/{attempt.total_questions}</td>
                    <td>{new Date(attempt.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="text-h2 mb-6">Lịch Sử Làm Bài Của Bạn</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ngày Thi</th>
                  <th>Điểm Số</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-muted">Bạn chưa có bài thi nào</td></tr>
                )}
                {history.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{new Date(attempt.created_at).toLocaleString('vi-VN')}</td>
                    <td className="font-bold">{attempt.score}/{attempt.total_questions}</td>
                    <td>
                      <button 
                        onClick={() => navigate(`/result/${attempt.id}`)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
