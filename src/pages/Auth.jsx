import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPage({ setSession }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Đăng nhập: Tìm kiếm trong bảng users (case-insensitive username)
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .ilike('ten_dang_nhap', username)
          .eq('mat_khau', password)
          .single();

        if (fetchError || !data) {
          throw new Error('Sai tên đăng nhập hoặc mật khẩu!');
        }

        // Lưu vào localStorage
        const userSession = {
          id: data.id,
          username: data.ten_dang_nhap,
          full_name: data.ho_ten
        };
        localStorage.setItem('quiz_user', JSON.stringify(userSession));
        setSession(userSession);

      } else {
        // Đăng ký: Kiểm tra tên đăng nhập đã tồn tại chưa (case-insensitive)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .ilike('ten_dang_nhap', username)
          .single();

        if (existingUser) {
          throw new Error('Tên đăng nhập đã được sử dụng!');
        }

        // Chèn user mới
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            ho_ten: fullName,
            ten_dang_nhap: username,
            mat_khau: password
          }]);

        if (insertError) throw insertError;
        
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--background)',
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', 
        maxWidth: '420px', 
        padding: '40px',
        margin: '0 auto'
      }}>
        
        <div className="text-center mb-8">
          <img 
            src="https://i.postimg.cc/YSf7nw74/logo-103-min.png" 
            alt="Logo Bệnh Viện 103" 
            style={{ height: '100px', width: 'auto', margin: '0 auto 16px' }} 
          />
          <h2 className="text-primary auth-title">
            HỆ THỐNG ÔN THI<br/>TRẮC NGHIỆM ĐIỀU DƯỠNG
          </h2>
        </div>

        {error && (
          <div className="badge badge-danger mb-4" style={{width: '100%', padding: '12px', textAlign: 'center'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="grid grid-cols-1">
          {!isLogin && (
            <input
              type="text"
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              required
            />
          )}
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
          />
          
          <button type="submit" className="btn-primary mt-4" disabled={loading}>
            {loading ? 'Đang xử lý...' : (isLogin ? <><LogIn size={20}/> Đăng Nhập</> : <><UserPlus size={20}/> Đăng Ký</>)}
          </button>
        </form>

        <div className="text-center mt-8 pt-6" style={{borderTop: '1px solid #E2E8F0'}}>
          <p className="text-muted mb-4">
            {isLogin ? "Chưa có tài khoản? Tham gia ngay!" : "Đã có tài khoản? Chào mừng trở lại!"}
          </p>
          <button 
            type="button"
            className="btn-outline-primary" 
            style={{width: '100%', justifyContent: 'center'}}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Tạo Tài Khoản Mới' : 'Quay Lại Đăng Nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
