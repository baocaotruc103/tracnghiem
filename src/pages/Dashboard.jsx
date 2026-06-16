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
  const [showOptions, setShowOptions] = useState(false);

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
    <>
      <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="flex justify-between items-center mb-8 mobile-header-stack">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <img 
              src="https://i.postimg.cc/YSf7nw74/logo-103-min.png" 
              alt="Logo Bệnh Viện 103" 
              style={{ height: '50px', width: 'auto', flexShrink: 0 }} 
            />
            <h1 className="m-0 auth-title" style={{ color: '#009900' }}>
              HỆ THỐNG ÔN THI<br/>TRẮC NGHIỆM ĐIỀU DƯỠNG
            </h1>
          </div>
          <p className="text-muted mt-2">Chào mừng trở lại, <strong style={{color: 'var(--text-main)'}}>{session.full_name || session.username}</strong></p>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
          <LogOut size={18}/> Đăng xuất
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="glass-panel stat-card" style={{ 
          padding: '20px 16px', 
          background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', 
          borderColor: '#C7D2FE' 
        }}>
          <Users size={28} color="var(--primary)" />
          <h3 className="text-h3 mt-2 mb-0" style={{ color: '#4F46E5', fontSize: '0.95rem' }}>Lượt đăng ký</h3>
          <div className="stat-value" style={{ marginTop: '0', fontSize: '2.5rem' }}>{stats.usersCount}</div>
        </div>
        
        <div className="glass-panel stat-card" style={{ 
          padding: '20px 16px', 
          background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', 
          borderColor: '#A7F3D0' 
        }}>
          <BookOpen size={28} color="var(--success)" />
          <h3 className="text-h3 mt-2 mb-0" style={{ color: '#059669', fontSize: '0.95rem' }}>Lượt làm bài</h3>
          <div className="stat-value" style={{ marginTop: '0', fontSize: '2.5rem', color: 'var(--success)' }}>{stats.testsCount}</div>
        </div>

        <div className="glass-panel flex flex-col items-center justify-center text-center p-4">
          <button 
            onClick={() => setShowOptions(true)} 
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
            <Trophy color="gold" /> Top điểm cao
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên</th>
                  <th>Điểm</th>
                  <th>Thời gian thi</th>
                </tr>
              </thead>
              <tbody>
                {top10.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted">Chưa có dữ liệu</td></tr>
                )}
                {top10.map((attempt, index) => (
                  <tr key={attempt.id}>
                    <td data-label="Hạng">
                      <span className="badge" style={{
                        background: index === 0 ? '#FEF3C7' : index === 1 ? '#F3F4F6' : index === 2 ? '#FEF2F2' : '#EEF2FF',
                        color: index === 0 ? '#D97706' : index === 1 ? '#4B5563' : index === 2 ? '#B91C1C' : 'var(--primary)',
                        fontSize: index < 3 ? '1rem' : '0.85rem',
                        padding: index < 3 ? '6px 16px' : '4px 12px'
                      }}>
                        {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                      </span>
                    </td>
                    <td data-label="Tên" className={`mobile-uppercase ${index < 3 ? 'font-bold' : ''}`} style={{ 
                      fontSize: index === 0 ? '1.1rem' : '1rem',
                      color: index === 0 ? '#009900' : 'inherit',
                      fontWeight: index === 0 ? '900' : (index < 3 ? '700' : 'normal')
                    }}>
                      {attempt.users?.ho_ten || attempt.users?.ten_dang_nhap || 'Ẩn danh'}
                    </td>
                    <td data-label="Điểm" className="font-bold" style={{ 
                      fontSize: index === 0 ? '1.2rem' : '1rem',
                      color: index === 0 ? '#009900' : 'var(--primary)',
                      fontWeight: index === 0 ? '900' : '700'
                    }}>
                      {attempt.score}/{attempt.total_questions}
                    </td>
                    <td data-label="Thời gian thi" className={index === 0 ? 'font-bold' : 'text-muted'} style={{
                      color: index === 0 ? '#009900' : 'inherit',
                      fontWeight: index === 0 ? '900' : 'normal'
                    }}>
                      {new Date(attempt.created_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="text-h2 mb-6" style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.8rem)', whiteSpace: 'nowrap' }}>
            Lịch Sử Làm Bài Của Bạn
          </h2>
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
                  <tr>
                    <td colSpan="3" className="text-center text-muted" style={{ padding: '32px' }}>
                      <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Bạn chưa hoàn thành bài thi nào.</p>
                    </td>
                  </tr>
                )}
                {history.map((attempt) => {
                  const percentage = (attempt.score / attempt.total_questions) * 100;
                  const isPass = percentage >= 50;
                  return (
                    <tr key={attempt.id}>
                      <td data-label="Ngày Thi">{new Date(attempt.created_at).toLocaleString('vi-VN')}</td>
                      <td data-label="Điểm Số">
                        <span className="badge" style={{
                          background: isPass ? '#ECFDF5' : '#FEF2F2',
                          color: isPass ? '#059669' : '#DC2626',
                          fontSize: '1rem'
                        }}>
                          {attempt.score} / {attempt.total_questions}
                        </span>
                      </td>
                      <td data-label="Hành Động">
                        <button 
                          onClick={() => navigate(`/result/${attempt.id}`)}
                          className="btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px' }}
                        >
                          Xem kết quả
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {showOptions && (
      <div className="modal-overlay" onClick={() => setShowOptions(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="text-h2 mb-6">Chọn Chế Độ Thi</h2>
          
          <button className="modal-option-btn" onClick={() => navigate('/test', { state: { mode: '100' } })}>
            Mặc định (100 câu)
          </button>
          
          <button className="modal-option-btn" onClick={() => navigate('/test', { state: { mode: '50' } })}>
            Ngắn gọn (50 câu)
          </button>
          
          <button className="modal-option-btn" onClick={() => navigate('/test', { state: { mode: 'wrong' } })}>
            Các câu làm sai
          </button>

          <button 
            className="btn-secondary mt-4 w-full" 
            onClick={() => setShowOptions(false)}
            style={{ width: '100%' }}
          >
            Hủy
          </button>
        </div>
      </div>
    )}
  </>
  );
}
