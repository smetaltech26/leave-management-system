import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FormLogin from './components/FormLogin';
import HomeDashboard from './components/HomeDashboard';
import LeaveFormModal from './components/LeaveFormModal';
import ApprovalPage from './components/ApprovalPage';
import LeaveCalendar from './components/LeaveCalendar';
import LoginPage from './components/LoginPage';
import UsersPage from './components/UsersPage';
import SettingsPage from './components/SettingsPage';
import ReportPage from './components/ReportPage';
import PermissionsPage from './components/admin/PermissionsPage';

import * as api from './services/supabaseApi';
import { useModal } from './contexts/ModalContext';

export default function App() {
  const [users, setUsers] = useState([]);
  const [userPolicies, setUserPolicies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { showConfirm, showAlert } = useModal();

  const [currentUser, setCurrentUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('home');
  const mainScrollRef = useRef(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenLeaveModal = (req = null) => {
    setEditingRequest(req);
    setIsLeaveModalOpen(true);
  };

  // Theme State: 'light' หรือ 'dark' (เริ่มต้นโหมดสว่าง Clean Light Mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smt_theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('smt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [u, p, r, h, a, d, perms, lt] = await Promise.all([
          api.fetchAllUsers(),
          api.fetchAllUserPolicies(),
          api.fetchAllRequests(),
          api.fetchAllHolidays(),
          api.fetchAllAgencies(),
          api.fetchAllDepartments(),
          api.fetchAllPermissions(),
          api.fetchAllLeaveTypes()
        ]);
        setUsers(u);
        setUserPolicies(p);
        setRequests(r);
        setHolidays(h);
        setAgencies(a);
        setDepartments(d);
        setPermissions(perms);
        setLeaveTypes(lt);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // เลื่อนจอขึ้นบนสุดเมื่อมีการเปลี่ยนหน้าหรือล็อกอิน
  useLayoutEffect(() => {
    if (!currentUser) return;
    
    // วิธีแก้ปัญหา iOS Safari/Chrome Scroll Bug แบบขั้นเด็ดขาด
    // 1. ซ่อน overflow ชั่วคราวเพื่อรีเซ็ต Visual Viewport
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // 2. บังคับเลื่อนไปที่ 1px ก่อน แล้วกลับมา 0 เพื่อกระตุ้น iOS WKWebView
    window.scrollTo(0, 1);
    
    const timer1 = setTimeout(() => {
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, 0);
      
      // รีเซ็ต scroller ภายในด้วยเผื่อหน้าจอใหญ่
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
    }, 50);
    
    // สำรองอีกรอบเผื่อคีย์บอร์ดยังหุบไม่เสร็จ
    const timer2 = setTimeout(() => {
      window.scrollTo(0, 0);
      if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
    }, 400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      document.body.style.overflow = originalOverflow;
    };
  }, [currentUser?.id, activeTab]);

  // ---------------------------------------------------------
  // Render: If not logged in, show LoginPage
  // ---------------------------------------------------------
  if (loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">กำลังโหลดข้อมูลระบบ...</div>;
  }

  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} users={users} theme={theme} toggleTheme={toggleTheme} />;
  }

  // คำนวณจำนวนรายการรออนุมัติสำหรับ currentUser
  const pendingCount = requests.filter(r => {
    if (r.status !== 'Pending') return false;
    const stepObj = r.approvers.find(a => a.step_number === r.current_step);
    return stepObj && stepObj.approver_id === currentUser?.id && stepObj.status === 'Pending';
  }).length;

  // เพิ่มคำขอลาใหม่
  const handleAddRequest = async (newReq) => {
    try {
      const createdReq = await api.createLeaveRequest(newReq, newReq.approvers, newReq.attachments);
      setRequests(prev => [createdReq, ...prev]);

      await api.updateUserPolicyUsedDays(newReq.user_id, newReq.leave_type, Number(newReq.leave_duration));
      
      setUserPolicies(prevPolicies => {
        return prevPolicies.map(pol => {
          if (pol.user_id === newReq.user_id && pol.leave_type === newReq.leave_type) {
            const newUsed = Number(pol.used_days) + Number(newReq.leave_duration);
            return {
              ...pol,
              used_days: newUsed,
              remaining_days: pol.max_days - newUsed
            };
          }
          return pol;
        });
      });
    } catch (err) {
      console.error("Submit Error:", err);
      await showAlert("ไม่สามารถบันทึกคำขอลาได้: " + err.message);
      throw err;
    }
  };

  // แก้ไขคำขอลา
  const handleEditRequest = async (updatedReq) => {
    try {
      await api.updateLeaveRequest(updatedReq);
      
      setRequests(prev => {
        const oldReq = prev.find(r => r.id === updatedReq.id);
        if (!oldReq) return prev;
        
        const diff = Number(updatedReq.leave_duration) - Number(oldReq.leave_duration);
        
        if (diff !== 0 && oldReq.leave_type === updatedReq.leave_type) {
          // Fire and forget updating policy via API
          api.updateUserPolicyUsedDays(updatedReq.user_id, updatedReq.leave_type, diff).catch(console.error);
          
          setUserPolicies(prevPol => prevPol.map(pol => {
            if (pol.user_id === updatedReq.user_id && pol.leave_type === updatedReq.leave_type) {
              const newUsed = Number(pol.used_days) + diff;
              return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
            }
            return pol;
          }));
        }
        
        return prev.map(r => r.id === updatedReq.id ? updatedReq : r);
      });
    } catch (err) {
      console.error("Edit Error:", err);
      await showAlert("ไม่สามารถแก้ไขคำขอลาได้: " + err.message);
      throw err;
    }
  };

  // ลบคำขอลา
  const handleDeleteRequest = async (reqId) => {
    try {
      const reqToDelete = requests.find(r => r.id === reqId);
      await api.deleteLeaveRequest(reqId);
      
      if (reqToDelete) {
        await api.updateUserPolicyUsedDays(reqToDelete.user_id, reqToDelete.leave_type, -Number(reqToDelete.leave_duration));
        
        setUserPolicies(prevPol => prevPol.map(pol => {
          if (pol.user_id === reqToDelete.user_id && pol.leave_type === reqToDelete.leave_type) {
            const newUsed = Number(pol.used_days) - Number(reqToDelete.leave_duration);
            return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
          }
          return pol;
        }));
      }
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      console.error("Delete Error:", err);
      await showAlert("ไม่สามารถลบคำขอลาได้: " + err.message);
    }
  };

  // ดำเนินการอนุมัติ Step
  const handleApproveStep = async (requestId, stepNumber, comment) => {
    try {
      const req = requests.find(r => r.id === requestId);
      const totalSteps = req.approvers.length;
      const isFinal = stepNumber >= totalSteps;
      
      await api.approveStep(requestId, stepNumber, comment, isFinal);
      
      setRequests(prev => {
        return prev.map(r => {
          if (r.id === requestId) {
            const updatedApprovers = r.approvers.map(a => {
              if (a.step_number === stepNumber) {
                return { ...a, status: 'Approved', comment, action_date: new Date().toISOString() };
              }
              return a;
            });
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
    } catch (err) {
      console.error("Approve Error:", err);
      await showAlert("ไม่สามารถอนุมัติได้: " + err.message);
    }
  };

  // ดำเนินการปฏิเสธ Step
  const handleRejectStep = async (requestId, stepNumber, comment) => {
    try {
      const targetReq = requests.find(r => r.id === requestId);
      if (targetReq && (targetReq.status === 'Pending' || targetReq.status === 'Approved')) {
        await api.updateUserPolicyUsedDays(targetReq.user_id, targetReq.leave_type, -Number(targetReq.leave_duration));
        setUserPolicies(prevPol => prevPol.map(pol => {
          if (pol.user_id === targetReq.user_id && pol.leave_type === targetReq.leave_type) {
            const newUsed = Number(pol.used_days) - Number(targetReq.leave_duration);
            return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
          }
          return pol;
        }));
      }

      await api.rejectStep(requestId, stepNumber, comment);
      
      setRequests(prev => {
        return prev.map(r => {
          if (r.id === requestId) {
            const updatedApprovers = r.approvers.map(a => {
              if (a.step_number >= stepNumber) {
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
    } catch (err) {
      console.error("Reject Error:", err);
      await showAlert("ไม่สามารถปฏิเสธได้: " + err.message);
    }
  };

  const refreshRequests = async () => {
    try {
      const [updatedRequests, updatedPolicies] = await Promise.all([
        api.fetchAllRequests(),
        api.fetchAllUserPolicies()
      ]);
      setRequests(updatedRequests);
      setUserPolicies(updatedPolicies);
    } catch (err) {
      console.error("Refresh Error:", err);
      await showAlert("ไม่สามารถรีโหลดข้อมูลได้: " + err.message);
    }
  };

  const handleAdminEditRequest = async (oldReq, actionType, updates = null) => {
    try {
      if (actionType === 'UPDATE') {
        const diffDuration = Number(updates.leave_duration) - Number(oldReq.leave_duration);
        await api.adminUpdateLeaveRequest(oldReq.id, {
          date_start: updates.date_start,
          date_end: updates.date_end,
          leave_duration: updates.leave_duration,
          leave_type: updates.leave_type
        });

        // ถ้าเป็นการอัปเดตจำนวนวันลา และคำขอนั้น Approved หรือ Pending อยู่ ต้องอัปเดตโควตาด้วย
        if ((oldReq.status === 'Approved' || oldReq.status === 'Pending') && diffDuration !== 0) {
          if (oldReq.leave_type !== updates.leave_type) {
             await api.updateUserPolicyUsedDays(oldReq.user_id, oldReq.leave_type, -Number(oldReq.leave_duration));
             await api.updateUserPolicyUsedDays(oldReq.user_id, updates.leave_type, Number(updates.leave_duration));
             
             setUserPolicies(prevPol => prevPol.map(pol => {
                if (pol.user_id === oldReq.user_id) {
                  if (pol.leave_type === oldReq.leave_type) {
                    const newUsed = Number(pol.used_days) - Number(oldReq.leave_duration);
                    return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
                  }
                  if (pol.leave_type === updates.leave_type) {
                    const newUsed = Number(pol.used_days) + Number(updates.leave_duration);
                    return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
                  }
                }
                return pol;
             }));
          } else if (diffDuration !== 0) {
             await api.updateUserPolicyUsedDays(oldReq.user_id, oldReq.leave_type, diffDuration);
             setUserPolicies(prevPol => prevPol.map(pol => {
                if (pol.user_id === oldReq.user_id && pol.leave_type === oldReq.leave_type) {
                  const newUsed = Number(pol.used_days) + diffDuration;
                  return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
                }
                return pol;
             }));
          }
        }
        
        setRequests(prev => prev.map(r => r.id === oldReq.id ? { ...r, ...updates } : r));
        return 'บันทึกการแก้ไขเรียบร้อยแล้ว';

      } else if (actionType === 'REVERT_PENDING') {
        await api.adminUpdateLeaveRequest(oldReq.id, { status: 'Pending', current_step: 1, reject_reason: null });
        await api.adminResetApprovalSteps(oldReq.id);
        
        // ไม่ต้องคืนโควตา เพราะสถานะ Pending ยังถือว่าใช้โควตาอยู่
        
        setRequests(prev => prev.map(r => {
          if (r.id === oldReq.id) {
            const updatedApprovers = r.approvers.map(a => ({ ...a, status: 'Pending', comment: '', action_date: null }));
            return { ...r, status: 'Pending', current_step: 1, reject_reason: null, approvers: updatedApprovers };
          }
          return r;
        }));
        return 'ดึงกลับเป็นสถานะรออนุมัติเรียบร้อยแล้ว';

      } else if (actionType === 'CANCEL_LEAVE') {
        const cancelReason = `ยกเลิกโดย ${currentUser?.fullname || 'ผู้ดูแลระบบ'}`;
        await api.adminUpdateLeaveRequest(oldReq.id, { status: 'Rejected', reject_reason: cancelReason });
        
        if (oldReq.status === 'Approved' || oldReq.status === 'Pending') {
           await api.updateUserPolicyUsedDays(oldReq.user_id, oldReq.leave_type, -Number(oldReq.leave_duration));
           setUserPolicies(prevPol => prevPol.map(pol => {
              if (pol.user_id === oldReq.user_id && pol.leave_type === oldReq.leave_type) {
                const newUsed = Number(pol.used_days) - Number(oldReq.leave_duration);
                return { ...pol, used_days: newUsed, remaining_days: pol.max_days - newUsed };
              }
              return pol;
           }));
        }
        
        setRequests(prev => prev.map(r => r.id === oldReq.id ? { ...r, status: 'Rejected', reject_reason: cancelReason } : r));
        return 'ยกเลิกการลาและเปลี่ยนสถานะเป็นยกเลิกเรียบร้อยแล้ว';
      }

    } catch (err) {
      console.error("Error admin editing request:", err);
      throw err;
    }
  };

  // อัปเดตข้อมูลผู้ใช้ (เช่น บันทึก LINE User ID)
  const handleUpdateUser = async (updatedUser) => {
    try {
      await api.updateUserProfile(updatedUser.id, updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Save User Error:", err);
      await showAlert("ไม่สามารถบันทึกข้อมูลผู้ใช้ได้: " + err.message);
    }
  };

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] w-full flex flex-col ambient-light-bg transition-colors duration-300 overflow-visible md:overflow-hidden relative">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex w-full px-0 md:px-2 lg:px-6 pb-0 overflow-visible md:overflow-hidden relative md:min-h-0">
        
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          pendingCount={pendingCount}
          onOpenLeaveModal={() => handleOpenLeaveModal(null)}
          permissions={permissions}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Dynamic Page Views */}
        <main ref={mainScrollRef} className="flex-1 p-4 md:p-6 pb-24 md:pb-6 min-w-0 overflow-visible md:overflow-y-auto md:min-h-0">
          {activeTab === 'home' && (
            <HomeDashboard
              currentUser={currentUser}
              userPolicies={userPolicies}
              requests={requests}
              onDeleteRequest={handleDeleteRequest}
              onOpenLeaveModal={handleOpenLeaveModal}
              setActiveTab={setActiveTab}
              agencies={agencies}
              departments={departments}
              users={users}
              onRefresh={refreshRequests}
              leaveTypes={leaveTypes}
            />
          )}

          {activeTab === 'approval' && (
            <ApprovalPage
              currentUser={currentUser}
              requests={requests}
              users={users}
              agencies={agencies}
              departments={departments}
              onApproveStep={handleApproveStep}
              onRejectStep={handleRejectStep}
              onAdminEditRequest={handleAdminEditRequest}
              holidays={holidays}
              onRefresh={refreshRequests}
              leaveTypes={leaveTypes}
            />
          )}

          {activeTab === 'calendar' && (
            <LeaveCalendar
              requests={requests}
              holidays={holidays}
              currentUser={currentUser}
              users={users}
              agencies={agencies}
              departments={departments}
              leaveTypes={leaveTypes}
              userPolicies={userPolicies}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage
              users={users}
              currentUser={currentUser}
              setUsers={setUsers}
              agencies={agencies}
              departments={departments}
              userPolicies={userPolicies}
              requests={requests}
              leaveTypes={leaveTypes}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              userPolicies={userPolicies}
              setUserPolicies={setUserPolicies}
              holidays={holidays}
              setHolidays={setHolidays}
              users={users}
              agencies={agencies}
              setAgencies={setAgencies}
              departments={departments}
              setDepartments={setDepartments}
              leaveTypes={leaveTypes}
              setLeaveTypes={setLeaveTypes}
            />
          )}

          {activeTab === 'report' && (
            <ReportPage
              requests={requests}
              users={users}
              agencies={agencies}
              departments={departments}
              leaveTypes={leaveTypes}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionsPage
              permissions={permissions}
              setPermissions={setPermissions}
            />
          )}
        </main>

      </div>

      {/* Leave Request Form Modal */}
      <LeaveFormModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setEditingRequest(null);
        }}
        currentUser={currentUser}
        users={users}
        userPolicies={userPolicies}
        requests={requests}
        editingRequest={editingRequest}
        holidays={holidays}
        onSubmitRequest={handleAddRequest}
        onEditRequest={handleEditRequest}
        agencies={agencies}
        departments={departments}
        leaveTypes={leaveTypes}
      />

    </div>
  );
}
