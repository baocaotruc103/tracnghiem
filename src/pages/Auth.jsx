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
        // Đăng nhập: Tìm kiếm trong bảng users
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('ten_dang_nhap', username)
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
        // Đăng ký: Kiểm tra tên đăng nhập đã tồn tại chưa
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('ten_dang_nhap', username)
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
    <div className="container flex items-center justify-center animate-fade-in" style={{minHeight: '100vh'}}>
      <div className="glass-panel" style={{maxWidth: '400px', width: '100%'}}>
        <h1 className="text-h2 text-center mb-6">
          {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
        </h1>
        
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

        <div className="text-center mt-6">
          <p className="text-muted">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button 
              type="button"
              className="text-primary" 
              style={{background: 'transparent', fontWeight: 'bold'}}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
