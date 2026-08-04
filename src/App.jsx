import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FormLogin from './components/FormLogin';
import HomeDashboard from './components/HomeDashboard';
import LeaveFormModal from './components/LeaveFormModal';
import ApprovalPage from './components/ApprovalPage';
import LeaveCalendar from './components/LeaveCalendar';
import UsersPage from './components/UsersPage';
import SettingsPage from './components/SettingsPage';
import ReportPage from './components/ReportPage';

import {
  INITIAL_USERS,
  INITIAL_AGENCIES,
  INITIAL_DEPARTMENTS,
  INITIAL_USER_POLICIES,
  INITIAL_REQUESTS,
  INITIAL_HOLIDAYS
} from './lib/mockData';

export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [userPolicies, setUserPolicies] = useState(INITIAL_USER_POLICIES);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);

  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[2]); // เริ่มต้นที่พนักงาน (USER-008)
  const [activeTab, setActiveTab] = useState('home');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // คำนวณจำนวนรายการรออนุมัติสำหรับ currentUser
  const pendingCount = requests.filter(r => {
    if (r.status !== 'Pending') return false;
    const stepObj = r.approvers.find(a => a.step_number === r.current_step);
    return stepObj && stepObj.approver_id === currentUser?.id && stepObj.status === 'Pending';
  }).length;

  // เพิ่มคำขอลาใหม่
  const handleAddRequest = (newReq) => {
    setRequests([newReq, ...requests]);

    // หักวันลาใน userPolicies
    setUserPolicies(prevPolicies => {
      return prevPolicies.map(pol => {
        if (pol.user_id === newReq.user_id && pol.leave_type === newReq.leave_type) {
          const newUsed = pol.used_days + newReq.leave_duration;
          return {
            ...pol,
            used_days: newUsed,
            remaining_days: pol.max_days - newUsed
          };
        }
        return pol;
      });
    });
  };

  // ดำเนินการอนุมัติ Step
  const handleApproveStep = (requestId, stepNumber, comment) => {
    setRequests(prev => {
      return prev.map(r => {
        if (r.id === requestId) {
          const updatedApprovers = r.approvers.map(a => {
            if (a.step_number === stepNumber) {
              return { ...a, status: 'Approved', comment, action_date: new Date().toISOString() };
            }
            return a;
          });

          const totalSteps = r.approvers.length;
          const isFinal = stepNumber >= totalSteps;

          return {
            ...r,
            approvers: updatedApprovers,
            current_step: isFinal ? r.current_step : r.current_step + 1,
            status: isFinal ? 'Approved' : 'Pending'
          };
        }
        return r;
      });
    });
  };

  // ดำเนินการปฏิเสธ Step
  const handleRejectStep = (requestId, stepNumber, comment) => {
    setRequests(prev => {
      return prev.map(r => {
        if (r.id === requestId) {
          const updatedApprovers = r.approvers.map(a => {
            if (a.step_number === stepNumber) {
              return { ...a, status: 'Rejected', comment, action_date: new Date().toISOString() };
            }
            return a;
          });

          return {
            ...r,
            approvers: updatedApprovers,
            status: 'Rejected',
            reject_reason: comment
          };
        }
        return r;
      });
    });
  };

  // อัปเดตข้อมูลผู้ใช้ (เช่น บันทึก LINE User ID)
  const handleUpdateUser = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  if (!currentUser) {
    return <FormLogin onLogin={(u) => setCurrentUser(u)} users={users} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          pendingCount={pendingCount}
          onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeDashboard
              currentUser={currentUser}
              userPolicies={userPolicies}
              requests={requests}
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'approval' && (
            <ApprovalPage
              currentUser={currentUser}
              requests={requests}
              users={users}
              onApproveStep={handleApproveStep}
              onRejectStep={handleRejectStep}
            />
          )}

          {activeTab === 'calendar' && (
            <LeaveCalendar
              requests={requests}
              holidays={holidays}
              users={users}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              users={users}
              onUpdateUser={handleUpdateUser}
              agencies={INITIAL_AGENCIES}
              departments={INITIAL_DEPARTMENTS}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              userPolicies={userPolicies}
              holidays={holidays}
              onUpdatePolicies={setUserPolicies}
            />
          )}

          {activeTab === 'report' && (
            <ReportPage
              requests={requests}
              users={users}
            />
          )}
        </main>

      </div>

      {/* Leave Request Form Modal */}
      <LeaveFormModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        currentUser={currentUser}
        users={users}
        userPolicies={userPolicies}
        onSubmitRequest={handleAddRequest}
      />

    </div>
  );
}
