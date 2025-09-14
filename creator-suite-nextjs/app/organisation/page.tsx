'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiUsers, FiUserPlus, FiSettings, FiTrash2, FiEdit3, FiMail, FiShield, FiBarChart, FiFolder, FiShare2, FiCreditCard } from 'react-icons/fi';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  projectsCount: number;
  totalGenerations: number;
}

interface OrganisationStats {
  totalMembers: number;
  activeProjects: number;
  totalGenerations: number;
  monthlySpend: number;
  storageUsed: number;
  storageLimit: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
  status: 'active' | 'archived' | 'draft';
  generationCount: number;
  lastActivity: string;
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@company.com',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
    lastActive: '2024-01-15T14:30:00Z',
    projectsCount: 12,
    totalGenerations: 2340
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'admin',
    joinedAt: '2024-01-05T00:00:00Z',
    lastActive: '2024-01-15T10:15:00Z',
    projectsCount: 8,
    totalGenerations: 1567
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'editor',
    joinedAt: '2024-01-10T00:00:00Z',
    lastActive: '2024-01-14T16:45:00Z',
    projectsCount: 5,
    totalGenerations: 892
  },
  {
    id: '4',
    name: 'Emma Davis',
    email: 'emma@company.com',
    role: 'viewer',
    joinedAt: '2024-01-12T00:00:00Z',
    lastActive: '2024-01-13T09:20:00Z',
    projectsCount: 2,
    totalGenerations: 145
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Q1 Marketing Campaign',
    description: 'Video content for social media marketing campaign',
    createdBy: 'John Smith',
    createdAt: '2024-01-08T00:00:00Z',
    members: ['1', '2', '3'],
    status: 'active',
    generationCount: 45,
    lastActivity: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Product Demo Series',
    description: 'Educational video series showcasing product features',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-01-10T00:00:00Z',
    members: ['2', '3', '4'],
    status: 'active',
    generationCount: 28,
    lastActivity: '2024-01-14T16:45:00Z'
  },
  {
    id: '3',
    name: 'Brand Identity Assets',
    description: 'Image assets for brand refresh project',
    createdBy: 'Mike Chen',
    createdAt: '2024-01-12T00:00:00Z',
    members: ['3', '4'],
    status: 'draft',
    generationCount: 12,
    lastActivity: '2024-01-13T11:20:00Z'
  }
];

const mockStats: OrganisationStats = {
  totalMembers: 4,
  activeProjects: 8,
  totalGenerations: 5944,
  monthlySpend: 245.67,
  storageUsed: 2.4,
  storageLimit: 10
};

const roleColors = {
  owner: '#ff4d4f',
  admin: '#faad14',
  editor: '#0099ff',
  viewer: '#52c41a'
};

const rolePermissions = {
  owner: ['All permissions', 'Manage billing', 'Invite members', 'Delete organization'],
  admin: ['Manage members', 'Create projects', 'View analytics', 'Manage settings'],
  editor: ['Create and edit content', 'Share projects', 'View team content'],
  viewer: ['View projects', 'Comment on content', 'Download assets']
};

export default function OrganisationPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [stats] = useState<OrganisationStats>(mockStats);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'settings'>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleInviteMember = () => {
    if (inviteEmail) {
      // In a real app, this would send an invitation
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      setMembers(members.filter(member => member.id !== memberId));
    }
  };

  const handleRoleChange = (memberId: string, newRole: TeamMember['role']) => {
    setMembers(members.map(member =>
      member.id === memberId ? { ...member, role: newRole } : member
    ));
  };

  const MemberCard = ({ member }: { member: TeamMember }) => {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0099ff, #8000ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {member.name.charAt(0)}
          </div>
          <div>
            <h4 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{member.name}</h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 14 }}>{member.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{
                background: roleColors[member.role],
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500
              }}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Joined {formatDate(member.joinedAt)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{member.projectsCount} projects</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{member.totalGenerations} generations</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelectedMember(member)}
              style={{
                padding: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <FiSettings size={16} />
            </button>
            {member.role !== 'owner' && (
              <button
                onClick={() => handleRemoveMember(member.id)}
                style={{
                  padding: '8px',
                  background: 'rgba(255,77,79,0.1)',
                  border: '1px solid rgba(255,77,79,0.3)',
                  borderRadius: 6,
                  color: '#ff4d4f',
                  cursor: 'pointer'
                }}
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const statusColors = {
      active: '#52c41a',
      archived: '#8c8c8c',
      draft: '#faad14'
    };

    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h4 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{project.name}</h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 14 }}>{project.description}</p>
          </div>
          <span style={{
            background: statusColors[project.status],
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500
          }}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            Created by {project.createdBy} • {project.members.length} members
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            {project.generationCount} generations
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #0099ff, #8000ff)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14
          }}>
            Open Project
          </button>
          <button style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer'
          }}>
            <FiShare2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const MemberDetailModal = ({ member, onClose }: { member: TeamMember | null; onClose: () => void }) => {
    if (!member) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }} onClick={onClose}>
        <div style={{
          background: '#0b0b0b',
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.1)'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0099ff, #8000ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold'
              }}>
                {member.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{member.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>{member.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 24,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Role</label>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                  disabled={member.role === 'owner'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Last Active</label>
                <p style={{ color: '#fff', margin: 0, fontSize: 14 }}>{formatDate(member.lastActive)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{member.projectsCount}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Projects</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{member.totalGenerations}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Generations</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{formatDate(member.joinedAt)}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Joined</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#fff', marginBottom: 12 }}>Permissions</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {rolePermissions[member.role].map((permission, idx) => (
                <span key={idx} style={{
                  background: 'rgba(0,153,255,0.2)',
                  color: '#0099ff',
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: 12
                }}>
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>Organization</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
            Manage your team, projects, and organization settings
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiUsers style={{ color: '#0099ff', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{stats.totalMembers}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Team Members</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiFolder style={{ color: '#52c41a', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{stats.activeProjects}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Active Projects</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiBarChart style={{ color: '#faad14', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{stats.totalGenerations.toLocaleString()}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Total Generations</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 20,
            textAlign: 'center'
          }}>
            <FiCreditCard style={{ color: '#ff4d4f', fontSize: 24, marginBottom: 8 }} />
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>${stats.monthlySpend.toFixed(2)}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Monthly Spend</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          padding: 4,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          width: 'fit-content'
        }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'members', label: 'Members' },
            { key: 'projects', label: 'Projects' },
            { key: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.key ? 'linear-gradient(90deg, #0099ff, #8000ff)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            <div>
              <h2 style={{ color: '#fff', marginBottom: 16 }}>Recent Activity</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projects.slice(0, 3).map(project => (
                  <div key={project.id} style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{project.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      Updated by {project.createdBy} • {formatDate(project.lastActivity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ color: '#fff', marginBottom: 16 }}>Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <FiUserPlus size={16} />
                  Invite Member
                </button>
                <button style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <FiFolder size={16} />
                  New Project
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Team Members</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    width: 250
                  }}
                />
                <button
                  onClick={handleInviteMember}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <FiMail size={16} />
                  Invite
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {members.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Projects</h2>
              <button style={{
                padding: '12px 20px',
                background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FiFolder size={16} />
                New Project
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 24
            }}>
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 32
          }}>
            <h2 style={{ color: '#fff', marginBottom: 24 }}>Organization Settings</h2>

            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <h3 style={{ color: '#fff', marginBottom: 12 }}>General Settings</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Organization Name</label>
                    <input
                      type="text"
                      defaultValue="Creative Studio Inc."
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 14
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Default Project Permissions</label>
                    <select style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14
                    }}>
                      <option>Private</option>
                      <option>Team Only</option>
                      <option>Public</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#fff', marginBottom: 12 }}>Billing & Usage</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.storageUsed}GB</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Used</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.storageLimit}GB</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Limit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member Detail Modal */}
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      </div>
    </div>
  );
}
