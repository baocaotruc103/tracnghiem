import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, Clock } from 'lucide-react';

export default function TestRoom({ session }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes in seconds

  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    fetchQuestions();
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Watch for timeout to auto-submit
  useEffect(() => {
    if (timeLeft === 0 && !isSubmittingRef.current && questions.length > 0) {
      alert('Đã hết thời gian làm bài! Hệ thống sẽ tự động nộp bài.');
      handleSubmit(true);
    }
  }, [timeLeft, questions]);

  const fetchQuestions = async () => {
    try {
      // Gọi hàm RPC lấy câu hỏi ưu tiên chưa làm
      const { data, error } = await supabase.rpc('get_personalized_questions', { 
        p_user_id: session.id, 
        p_num_questions: 100 
      });
      
      if (error) {
        // Fallback in case RPC is not yet created by user
        console.warn('RPC failed or not found, falling back to standard fetch');
        const { data: fallbackData } = await supabase.from('bo_de').select('*').limit(100);
        const shuffled = fallbackData?.sort(() => 0.5 - Math.random()) || [];
        setQuestions(shuffled);
      } else {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Không thể tải câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option) => {
    const qId = questions[currentIdx].id || questions[currentIdx].cau_hoi;
    setAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (Object.keys(answers).length < questions.length) {
        const confirmSubmit = window.confirm('Bạn chưa làm hết các câu hỏi. Vẫn nộp bài?');
        if (!confirmSubmit) return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    
    setSubmitting(true);
    isSubmittingRef.current = true;
    let score = 0;
    
    // Tính điểm
    questions.forEach(q => {
      const qId = q.id || q.cau_hoi;
      if (answers[qId] === q.dap_an) {
        score += 1;
      }
    });

    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .insert([
          {
            user_id: session.id,
            score: score,
            total_questions: questions.length,
            answers_data: answers
          }
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/result/${data.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Lỗi nộp bài!');
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{minHeight: '100vh'}}>Đang tải bài thi...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="container flex items-center justify-center" style={{minHeight: '100vh'}}>
        <div className="glass-panel text-center">
          <h2>Chưa có câu hỏi nào trong hệ thống!</h2>
          <button className="btn-secondary mt-4" onClick={() => navigate('/dashboard')}>Về Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const progressPercentage = (Object.keys(answers).length / questions.length) * 100;
  const isTimeCritical = timeLeft < 300; // Under 5 minutes

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '20px', paddingBottom: '40px', maxWidth: '800px' }}>
      
      <div className="progress-container mt-0 mb-8">
        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className="glass-panel">
        <h3 className="text-h3 mb-6 text-primary">Câu {currentIdx + 1}: {currentQ.noi_dung}</h3>
        
        <div className="grid grid-cols-1 gap-2">
          {['A', 'B', 'C', 'D'].map(opt => {
            if (!currentQ[opt]) return null;
            const qId = currentQ.id || currentQ.cau_hoi;
            return (
              <button
                key={opt}
                className={`option-btn ${answers[qId] === opt ? 'selected' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                <strong>{opt}.</strong> {currentQ[opt]}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-8 pt-4 mobile-header-stack" style={{borderTop: '1px solid #E2E8F0'}}>
          <button 
            className="btn-secondary flex items-center gap-2 justify-center" 
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}
          >
            <ChevronLeft size={20} /> Câu trước
          </button>
          
          {currentIdx === questions.length - 1 ? (
            <button 
              className="btn-primary justify-center" 
              style={{ background: 'var(--success)' }}
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              <CheckCircle size={20} /> {submitting ? 'Đang nộp...' : 'Nộp Bài'}
            </button>
          ) : (
            <button 
              className="btn-primary justify-center" 
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
            >
              Câu tiếp <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="sticky-action-bar">
        <div className="badge badge-primary" style={{fontSize: '1rem'}}>
          Đã làm: {Object.keys(answers).length} / {questions.length}
        </div>
        <div className={`flex items-center gap-2 font-bold text-h2 mb-0 ${isTimeCritical ? 'text-danger animate-pulse' : 'text-primary'}`} style={{ color: isTimeCritical ? 'var(--danger)' : 'var(--primary)' }}>
          <Clock size={28} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="mt-8 glass-panel">
        <h4 className="mb-4 text-muted">Bảng điều hướng:</h4>
        <div className="nav-grid">
          {questions.map((q, idx) => {
            const qId = q.id || q.cau_hoi;
            return (
              <button
                key={qId}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '40px', height: '40px', 
                  borderRadius: '8px',
                  background: answers[qId] ? 'var(--primary)' : '#FFFFFF',
                  color: answers[qId] ? 'white' : 'var(--text-main)',
                  border: idx === currentIdx ? '2px solid var(--primary)' : '1px solid #CBD5E1',
                  cursor: 'pointer',
                  fontWeight: idx === currentIdx ? 'bold' : 'normal'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
