'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlay, FiPause, FiPlus, FiTrash2, FiEdit3, FiSave, FiDownload, FiClock, FiSettings, FiFileText, FiImage, FiVideo, FiMusic } from 'react-icons/fi';

interface VideoScene {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  prompt: string;
  model: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  thumbnail?: string;
  order: number;
}

interface LongVideoProject {
  id: string;
  title: string;
  description: string;
  totalDuration: number;
  scenes: VideoScene[];
  status: 'draft' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  estimatedCompletion: string;
  progress: number;
}

const mockProject: LongVideoProject = {
  id: '1',
  title: 'Product Tutorial Series',
  description: 'Comprehensive tutorial on using our AI platform',
  totalDuration: 1800, // 30 minutes
  status: 'draft',
  createdAt: '2024-01-15T10:00:00Z',
  estimatedCompletion: '2024-01-15T16:00:00Z',
  progress: 0,
  scenes: [
    {
      id: 'scene-1',
      title: 'Introduction',
      description: 'Welcome and overview of the platform',
      duration: 120,
      prompt: 'Create an engaging introduction video showing the AI platform interface with smooth transitions and professional narration',
      model: 'Runway ML',
      status: 'draft',
      order: 1
    },
    {
      id: 'scene-2',
      title: 'Getting Started',
      description: 'Basic setup and account creation',
      duration: 180,
      prompt: 'Show the user registration process and initial dashboard setup with step-by-step visual guidance',
      model: 'Veo 3',
      status: 'draft',
      order: 2
    },
    {
      id: 'scene-3',
      title: 'Video Generation',
      description: 'How to create AI-generated videos',
      duration: 240,
      prompt: 'Demonstrate the video generation workflow including prompt creation, model selection, and parameter adjustment',
      model: 'Runway ML',
      status: 'draft',
      order: 3
    },
    {
      id: 'scene-4',
      title: 'Advanced Features',
      description: 'Tips and advanced techniques',
      duration: 300,
      prompt: 'Cover advanced features like custom styles, batch processing, and optimization techniques',
      model: 'Hailuo AI',
      status: 'draft',
      order: 4
    },
    {
      id: 'scene-5',
      title: 'Conclusion',
      description: 'Summary and next steps',
      duration: 90,
      prompt: 'End with a summary of key points and call-to-action for users to start creating',
      model: 'Veo 3',
      status: 'draft',
      order: 5
    }
  ]
};

const availableModels = [
  { id: 'runway-ml', name: 'Runway ML', maxDuration: 10, quality: 'High' },
  { id: 'veo3', name: 'Veo 3', maxDuration: 60, quality: 'Ultra High' },
  { id: 'hailuo-ai', name: 'Hailuo AI', maxDuration: 5, quality: 'Medium' }
];

export default function LongVideoPage() {
  const [project, setProject] = useState<LongVideoProject>(mockProject);
  const [selectedScene, setSelectedScene] = useState<VideoScene | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'preview' | 'settings'>('scenes');

  const addScene = () => {
    const newScene: VideoScene = {
      id: `scene-${Date.now()}`,
      title: 'New Scene',
      description: '',
      duration: 60,
      prompt: '',
      model: 'runway-ml',
      status: 'draft',
      order: project.scenes.length + 1
    };
    setProject({
      ...project,
      scenes: [...project.scenes, newScene],
      totalDuration: project.totalDuration + newScene.duration
    });
  };

  const updateScene = (sceneId: string, updates: Partial<VideoScene>) => {
    setProject({
      ...project,
      scenes: project.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    });
  };

  const deleteScene = (sceneId: string) => {
    const sceneToDelete = project.scenes.find(s => s.id === sceneId);
    setProject({
      ...project,
      scenes: project.scenes.filter(scene => scene.id !== sceneId).map((scene, index) => ({
        ...scene,
        order: index + 1
      })),
      totalDuration: project.totalDuration - (sceneToDelete?.duration || 0)
    });
  };

  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    const currentIndex = project.scenes.findIndex(s => s.id === sceneId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === project.scenes.length - 1)
    ) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newScenes = [...project.scenes];
    [newScenes[currentIndex], newScenes[newIndex]] = [newScenes[newIndex], newScenes[currentIndex]];

    // Update order numbers
    newScenes.forEach((scene, index) => {
      scene.order = index + 1;
    });

    setProject({ ...project, scenes: newScenes });
  };

  const startGeneration = () => {
    setIsGenerating(true);
    setProject({ ...project, status: 'generating' });

    // Simulate generation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        setProject(prev => ({ ...prev, status: 'completed', progress: 100 }));
        setIsGenerating(false);
        clearInterval(interval);
      } else {
        setProject(prev => ({ ...prev, progress }));
      }
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const SceneCard = ({ scene }: { scene: VideoScene }) => {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h4 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              Scene {scene.order}: {scene.title}
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 14 }}>
              {scene.description}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: scene.status === 'completed' ? '#52c41a' :
                         scene.status === 'generating' ? '#faad14' :
                         scene.status === 'failed' ? '#ff4d4f' : '#8c8c8c',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 12,
              fontSize: 12
            }}>
              {scene.status}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => moveScene(scene.id, 'up')}
                disabled={scene.order === 1}
                style={{
                  padding: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  color: scene.order === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: scene.order === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ↑
              </button>
              <button
                onClick={() => moveScene(scene.id, 'down')}
                disabled={scene.order === project.scenes.length}
                style={{
                  padding: '4px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  color: scene.order === project.scenes.length ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: scene.order === project.scenes.length ? 'not-allowed' : 'pointer'
                }}
              >
                ↓
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Duration</div>
            <div style={{ color: '#fff', fontSize: 14 }}>{formatDuration(scene.duration)}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Model</div>
            <div style={{ color: '#fff', fontSize: 14 }}>{scene.model}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Order</div>
            <div style={{ color: '#fff', fontSize: 14 }}>#{scene.order}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>Prompt</div>
          <p style={{ color: '#fff', margin: 0, fontSize: 14, lineHeight: 1.4 }}>
            {scene.prompt.length > 100 ? `${scene.prompt.substring(0, 100)}...` : scene.prompt}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSelectedScene(scene)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <FiEdit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => deleteScene(scene.id)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,77,79,0.1)',
              border: '1px solid rgba(255,77,79,0.3)',
              borderRadius: 6,
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    );
  };

  const SceneEditorModal = ({ scene, onClose }: { scene: VideoScene | null; onClose: () => void }) => {
    const [editedScene, setEditedScene] = useState<VideoScene | null>(scene);

    if (!editedScene) return null;

    const handleSave = () => {
      updateScene(editedScene.id, editedScene);
      onClose();
    };

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
          maxWidth: 800,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.1)'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ color: '#fff', margin: 0 }}>Edit Scene</h2>
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

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  value={editedScene.title}
                  onChange={(e) => setEditedScene({ ...editedScene, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Duration (seconds)</label>
                <input
                  type="number"
                  value={editedScene.duration}
                  onChange={(e) => setEditedScene({ ...editedScene, duration: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Description</label>
              <input
                type="text"
                value={editedScene.description}
                onChange={(e) => setEditedScene({ ...editedScene, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Model</label>
              <select
                value={editedScene.model}
                onChange={(e) => setEditedScene({ ...editedScene, model: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14
                }}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.name}>{model.name} (Max: {model.maxDuration}s)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Prompt</label>
              <textarea
                value={editedScene.prompt}
                onChange={(e) => setEditedScene({ ...editedScene, prompt: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', color: 'rgba(255,255,255,0.92)' }}>
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', marginBottom: 8 }}>Long Video Creator</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
            Create extended video content with multiple scenes and advanced editing
          </p>
        </div>

        {/* Project Overview */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 24,
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ color: '#fff', margin: 0, marginBottom: 4 }}>{project.title}</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>{project.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: project.status === 'completed' ? '#52c41a' :
                           project.status === 'generating' ? '#faad14' :
                           project.status === 'failed' ? '#ff4d4f' : '#8c8c8c',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 500,
                display: 'inline-block'
              }}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Total Duration</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatDuration(project.totalDuration)}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Scenes</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{project.scenes.length}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Progress</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{Math.round(project.progress)}%</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Estimated Cost</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>${(project.totalDuration * 0.001).toFixed(2)}</div>
            </div>
          </div>

          {project.status === 'generating' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Generation Progress</span>
                <span style={{ color: '#fff', fontSize: 14 }}>{Math.round(project.progress)}%</span>
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${project.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            {project.status === 'draft' && (
              <button
                onClick={startGeneration}
                disabled={isGenerating}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <FiPlay size={16} />
                {isGenerating ? 'Generating...' : 'Start Generation'}
              </button>
            )}
            {project.status === 'completed' && (
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #52c41a, #389e0d)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FiDownload size={16} />
                Download Video
              </button>
            )}
            <button style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiSettings size={16} />
              Settings
            </button>
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
            { key: 'scenes', label: 'Scenes', icon: FiVideo },
            { key: 'preview', label: 'Preview', icon: FiPlay },
            { key: 'settings', label: 'Settings', icon: FiSettings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
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
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'scenes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: '#fff', margin: 0 }}>Video Scenes</h2>
              <button
                onClick={addScene}
                style={{
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
                }}
              >
                <FiPlus size={16} />
                Add Scene
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {project.scenes.map(scene => (
                <SceneCard key={scene.id} scene={scene} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 32,
            textAlign: 'center'
          }}>
            <FiPlay size={48} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16 }} />
            <h3 style={{ color: '#fff', marginBottom: 8 }}>Video Preview</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              Preview functionality will be available once generation is complete
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 32 }}>
              {project.scenes.map(scene => (
                <div key={scene.id} style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    Scene {scene.order}: {scene.title}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    {formatDuration(scene.duration)}
                  </div>
                </div>
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
            <h2 style={{ color: '#fff', marginBottom: 24 }}>Project Settings</h2>

            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Project Title</label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Output Format</label>
                  <select style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}>
                    <option>MP4 (H.264)</option>
                    <option>WebM</option>
                    <option>MOV</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Resolution</label>
                  <select style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}>
                    <option>1920x1080 (Full HD)</option>
                    <option>1280x720 (HD)</option>
                    <option>3840x2160 (4K)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Frame Rate</label>
                  <select style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}>
                    <option>30 FPS</option>
                    <option>24 FPS</option>
                    <option>60 FPS</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Audio</label>
                  <select style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14
                  }}>
                    <option>Auto-generated</option>
                    <option>Upload custom</option>
                    <option>No audio</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scene Editor Modal */}
        <SceneEditorModal
          scene={selectedScene}
          onClose={() => setSelectedScene(null)}
        />
      </div>
    </div>
  );
}
