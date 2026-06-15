import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function TestResult({ session }) {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const { data: questionsData, error: qError } = await supabase
        .from('bo_de')
        .select('*');

      if (qError) throw qError;
      
      // Filter only questions that were answered or all questions? 
      // We will show all questions since we want to show correct answers for all
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
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px', maxWidth: '800px' }}>
      <button onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2 mb-6">
        <ArrowLeft size={18} /> Về Dashboard
      </button>

      <div className="glass-panel text-center mb-8">
        <h1 className="text-h1">Kết Quả Bài Thi</h1>
        <div style={{
          width: '150px', height: '150px', 
          borderRadius: '50%', 
          border: `8px solid ${percentage >= 50 ? 'var(--success)' : 'var(--danger)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          margin: '24px auto',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <span className="text-h2 mb-0" style={{lineHeight: 1}}>{attempt.score}/{attempt.total_questions}</span>
          <span className="text-muted">Câu đúng</span>
        </div>
        <p className="text-h3" style={{ color: percentage >= 50 ? 'var(--success)' : 'var(--danger)' }}>
          {percentage >= 80 ? 'Xuất sắc!' : percentage >= 50 ? 'Khá tốt!' : 'Cần cố gắng thêm!'}
        </p>
      </div>

      <h2 className="text-h2 mb-6">Chi tiết bài làm</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {questions.map((q, idx) => {
          const qId = q.id || q.cau_hoi;
          const userAns = attempt.answers_data[qId];
          const isCorrect = userAns === q.dap_an;
          
          return (
            <div key={qId} className="glass-panel">
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
  );
}
