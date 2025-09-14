'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlay, FiPause, FiCheck, FiX, FiEye, FiDownload, FiFilter, FiSearch } from 'react-icons/fi';

interface Task {
  id: string;
  type: 'video' | 'image';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title: string;
  model: string;
  created_at: string;
  completed_at?: string;
  duration?: number;
  result_url?: string;
  error_message?: string;
  parameters: {
    prompt?: string;
    style?: string;
    duration?: number;
    resolution?: string;
  };
}

const mockTasks: Task[] = [
  {
    id: '1',
    type: 'video',
    status: 'completed',
    title: 'Sunset landscape animation',
    model: 'Runway ML',
    created_at: '2024-01-15T10:30:00Z',
    completed_at: '2024-01-15T11:15:00Z',
    duration: 45,
    result_url: '/api/tasks/1/result',
    parameters: {
      prompt: 'Beautiful sunset over mountains with flowing water',
      style: 'cinematic',
      duration: 5,
      resolution: '1080p'
    }
  },
  {
    id: '2',
    type: 'image',
    status: 'processing',
    title: 'Abstract art composition',
    model: 'DALL-E 3',
    created_at: '2024-01-15T09:45:00Z',
    parameters: {
      prompt: 'Abstract geometric shapes in vibrant colors',
      style: 'modern',
      resolution: '1024x1024'
    }
  },
  {
    id: '3',
    type: 'video',
    status: 'failed',
    title: 'City timelapse',
    model: 'Stable Diffusion Video',
    created_at: '2024-01-14T16:20:00Z',
    error_message: 'Model temporarily unavailable',
    parameters: {
      prompt: 'Timelapse of city from dawn to dusk',
      style: 'documentary',
      duration: 10,
      resolution: '720p'
    }
  },
  {
    id: '4',
    type: 'image',
    status: 'pending',
    title: 'Portrait illustration',
    model: 'Midjourney',
    created_at: '2024-01-15T08:00:00Z',
    parameters: {
      prompt: 'Professional portrait of a young woman',
      style: 'realistic',
      resolution: '2048x2048'
    }
  }
];

const statusColors = {
  pending: '#faad14',
  processing: '#1890ff',
  completed: '#52c41a',
  failed: '#ff4d4f'
};

const statusIcons = {
  pending: FiPause,
  processing: FiPlay,
  completed: FiCheck,
  failed: FiX
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.parameters.prompt && task.parameters.prompt.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        const statusOrder = { pending: 0, processing: 1, completed: 2, failed: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, typeFilter, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: 'failed' as const, error_message: 'Cancelled by user' } : task
    ));
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusIcons[task.status];

    return (
      <div style={{
        padding: 20,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }} onClick={() => setSelectedTask(task)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{task.title}</h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 14 }}>
              {task.model} • {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: statusColors[task.status],
              fontSize: 14,
              fontWeight: 500
            }}>
              <StatusIcon size={16} />
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </div>
            {task.status === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCancelTask(task.id); }}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255,77,79,0.2)',
                  color: '#ff4d4f',
                  border: '1px solid rgba(255,77,79,0.3)',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            Created: {formatDate(task.created_at)}
          </span>
          {task.completed_at && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Duration: {task.duration}m
            </span>
          )}
        </div>

        {task.error_message && (
          <div style={{
            marginTop: 12,
            padding: 8,
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid rgba(255,77,79,0.3)',
            borderRadius: 4,
            color: '#ff4d4f',
            fontSize: 14
          }}>
            {task.error_message}
          </div>
        )}
      </div>
    );
  };

  const TaskDetailModal = ({ task, onClose }: { task: Task; onClose: () => void }) => {
    if (!task) return null;

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
          background: 'var(--bg)',
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid var(--border)'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ color: 'var(--text)', margin: 0 }}>{task.title}</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
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
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Type</label>
                <p style={{ color: 'var(--text)', margin: 0 }}>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Model</label>
                <p style={{ color: 'var(--text)', margin: 0 }}>{task.model}</p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Status</label>
                <p style={{ color: statusColors[task.status], margin: 0, fontWeight: 500 }}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </p>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Created</label>
                <p style={{ color: 'var(--text)', margin: 0 }}>{formatDate(task.created_at)}</p>
              </div>
            </div>

            {task.parameters.prompt && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Prompt</label>
                <p style={{ color: 'var(--text)', margin: 0 }}>{task.parameters.prompt}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {task.parameters.style && (
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Style</label>
                  <p style={{ color: 'var(--text)', margin: 0 }}>{task.parameters.style}</p>
                </div>
              )}
              {task.parameters.duration && (
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Duration</label>
                  <p style={{ color: 'var(--text)', margin: 0 }}>{task.parameters.duration}s</p>
                </div>
              )}
              {task.parameters.resolution && (
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Resolution</label>
                  <p style={{ color: 'var(--text)', margin: 0 }}>{task.parameters.resolution}</p>
                </div>
              )}
            </div>
          </div>

          {task.result_url && task.status === 'completed' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                padding: '12px 24px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FiDownload size={16} />
                Download
              </button>
              <button style={{
                padding: '12px 24px',
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FiEye size={16} />
                Preview
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>My Tasks</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Track and manage all your generation tasks
          </p>
        </div>

        {/* Filters and Search */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          padding: 20,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              minWidth: 120
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              minWidth: 120
            }}
          >
            <option value="all">All Types</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              minWidth: 120
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">By Status</option>
          </select>
        </div>

        {/* Tasks List */}
        <div style={{ marginBottom: 32 }}>
          {filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 60,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>No tasks found</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start creating your first task'}
              </p>
              <Link href="/video-generation">
                <button style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16
                }}>
                  Create Video Task
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>
                Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </div>
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </>
          )}
        </div>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </div>
  );
}
