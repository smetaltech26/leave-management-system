// Isolated browser fixture: no Supabase client, no production requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ReportPage from '../../src/components/ReportPage';
import { ModalProvider } from '../../src/contexts/ModalContext';
import { applyDeletedRequests, applyReturnedPolicies } from '../../src/lib/reportSelection';
import '../../src/index.css';

const initialRows = Array.from({ length: 25 }, (_, index) => ({
  id: `LEV-${String(index + 1).padStart(4, '0')}`, user_id: 'person', leave_type: 'ลาพักร้อน',
  date_start: index < 20 ? '2026-10-03' : '2027-01-04', date_end: index < 20 ? '2026-10-03' : '2027-01-04',
  status: 'Approved', leave_duration: 1, leave_period: 'Full', description: 'รายการจำลอง',
}));
function Fixture() {
  const [role, setRole] = useState('SuperAdmin');
  const [fail, setFail] = useState(false);
  const [requests, setRequests] = useState(initialRows);
  const [policies, setPolicies] = useState([{ id: 'quota', used_days: 25, remaining_days: 5 }]);
  const [calls, setCalls] = useState(0);
  const remove = async ids => {
    setCalls(value => value + 1);
    await new Promise(resolve => setTimeout(resolve, 150));
    if (fail) throw new Error('จำลองฐานข้อมูลปฏิเสธรายการ');
    const result = { deleted_ids: ids, policies: [{ id: 'quota', used_days: requests.length - ids.length, remaining_days: 30 - requests.length + ids.length }] };
    setRequests(previous => applyDeletedRequests(previous, result.deleted_ids));
    setPolicies(previous => applyReturnedPolicies(previous, result.policies));
    return result;
  };
  return <ModalProvider>
    <div className="p-4 flex flex-wrap gap-4">
      <select aria-label="Test role" value={role} onChange={event => setRole(event.target.value)}>
        {['SuperAdmin', 'Admin', 'SuperUser', 'User'].map(value => <option key={value}>{value}</option>)}
      </select>
      <label><input type="checkbox" checked={fail} onChange={event => setFail(event.target.checked)} /> Test failure</label>
      <output data-testid="requests">{requests.length}</output>
      <output data-testid="remaining">{policies[0].remaining_days}</output>
      <output data-testid="calls">{calls}</output>
    </div>
    <main className="p-4"><ReportPage currentUser={{ id: 'actor', role }} requests={requests}
      users={[{ id: 'person', fullname: 'พนักงานทดสอบ', employee_id: '001', avatar_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E' }]}
      agencies={[]} departments={[]} userPolicies={policies} onDeleteRequests={remove} />
    </main>
  </ModalProvider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
