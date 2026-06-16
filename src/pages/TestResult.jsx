import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';

export default function TestResult({ session }) {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' or 'wrong'
  const [isGridOpen, setIsGridOpen] = useState(false);

  useEffect(() => {
    fetchResultData();
  }, [attemptId]);

  const fetchResultData = async () => {
    try {
      // 1. Fetch attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      
      if (attemptError) throw attemptError;
      setAttempt(attemptData);

      // 2. Fetch questions
      let questionsData = [];
      if (attemptData.questions_list && attemptData.questions_list.length > 0) {
        const { data, error } = await supabase
          .from('bo_de')
          .select('*')
          .in('id', attemptData.questions_list.map(id => parseInt(id)).filter(id => !isNaN(id)));

        if (error) throw error;
        
        // Sort to match original order
        questionsData = data.sort((a, b) => {
          const aId = a.id || a.cau_hoi;
          const bId = b.id || b.cau_hoi;
          return attemptData.questions_list.indexOf(aId) - attemptData.questions_list.indexOf(bId);
        });
      } else {
        // Fallback for old attempts
        const answeredIds = Object.keys(attemptData.answers_data || {}).map(id => parseInt(id)).filter(id => !isNaN(id));
        if (answeredIds.length > 0) {
          const { data, error } = await supabase.from('bo_de').select('*').in('id', answeredIds);
          if (error) throw error;
          questionsData = data;
        } else {
          const { data, error } = await supabase.from('bo_de').select('*').limit(100);
          if (error) throw error;
          questionsData = data;
        }
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching result:', error);
      alert('Không thể tải kết quả bài thi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center" style={{minHeight: '100vh'}}>Đang tải kết quả...</div>;
  }

  if (!attempt) return null;

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

  return (
    <>
      <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px', maxWidth: '800px' }}>
      <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2 mb-6">
        <ArrowLeft size={18} /> Về Dashboard
      </button>

      <div className="glass-panel text-center mb-8">
        <h1 className="text-h1 mb-4" style={{ whiteSpace: 'nowrap', fontSize: 'clamp(1.2rem, 5vw, 2.75rem)' }}>Kết Quả Bài Thi</h1>
        {attempt.ma_de && (
          <div className="badge badge-primary mb-2" style={{ fontSize: '1.1rem' }}>Mã đề: {attempt.ma_de}</div>
        )}
        <p className="text-h2 mt-4 mb-0" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>
          Số câu trả lời đúng: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{attempt.score}/{attempt.total_questions}</span>
        </p>
      </div>


      <h2 className="text-h2 mb-4">Chi tiết bài làm</h2>
      
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer" style={{fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1rem', padding: '8px 16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
          <input 
            type="checkbox" 
            checked={filter === 'wrong'} 
            onChange={(e) => setFilter(e.target.checked ? 'wrong' : 'all')} 
            style={{width: '20px', height: '20px', accentColor: 'var(--danger)'}}
          />
          Chỉ hiển thị câu sai / chưa làm
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {questions.map((q, idx) => {
          const qId = q.id || q.cau_hoi;
          const userAns = attempt.answers_data[qId];
          const isCorrect = userAns === q.dap_an;
          
          if (filter === 'wrong' && isCorrect) return null;

          return (
            <div key={qId} id={`question-${idx}`} className="glass-panel" style={{ scrollMarginTop: '20px' }}>
              <h3 className="text-h3 mb-4 flex items-start gap-2">
                {isCorrect ? <CheckCircle color="var(--success)" className="mt-1 flex-shrink-0"/> : <XCircle color="var(--danger)" className="mt-1 flex-shrink-0"/>}
                <span>Câu {idx + 1}: {q.noi_dung}</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-2 pl-8">
                {['A', 'B', 'C', 'D'].map(opt => {
                  if (!q[opt]) return null;
                  
                  let btnClass = "option-btn";
                  let extraText = "";
                  
                  if (opt === q.dap_an) {
                    btnClass += " correct";
                    extraText = " (Đáp án đúng)";
                  } else if (opt === userAns && !isCorrect) {
                    btnClass += " wrong";
                    extraText = " (Bạn chọn)";
                  }

                  return (
                    <div
                      key={opt}
                      className={btnClass}
                      style={{ cursor: 'default', pointerEvents: 'none' }}
                    >
                      <strong>{opt}.</strong> {q[opt]} <i>{extraText}</i>
                    </div>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className={`fixed-footer-summary ${isGridOpen ? 'open' : ''}`}>
        <button 
          className="footer-toggle-btn" 
          onClick={() => setIsGridOpen(!isGridOpen)}
        >
          {isGridOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          Bảng Kết Quả
        </button>
        <div className="footer-content">
          <div className="summary-grid-container" style={{ marginTop: 0 }}>
            {questions.map((q, idx) => {
              const qId = q.id || q.cau_hoi;
              const userAns = attempt.answers_data?.[qId];
              let statusClass = 'skipped';
              if (userAns) {
                if (userAns === q.dap_an) statusClass = 'correct';
                else statusClass = 'wrong';
              }
              return (
                <a 
                  href={`#question-${idx}`} 
                  key={qId} 
                  className={`summary-square ${statusClass}`}
                  title={`Câu ${idx + 1}`}
                  onClick={() => setIsGridOpen(false)}
                >
                  {idx + 1}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
