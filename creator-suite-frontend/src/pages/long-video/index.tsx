import React, { useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, Space, Typography, Steps, Tag, Divider, List, Modal, message, Tooltip } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined, EditOutlined, DragOutlined, VideoCameraAddOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { history, useDispatch, useSelector } from 'umi';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface Segment {
  id: string;
  prompt: string;
}

const generateGroupId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const LongVideoStudio: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [groupId] = useState<string>(generateGroupId());
  const [isGenerating, setIsGenerating] = useState(false);
  const [editing, setEditing] = useState<{ index: number; prompt: string } | null>(null);

  const addSegment = () => {
    const prompt = form.getFieldValue('prompt');
    if (!prompt || prompt.trim().length < 10) {
      message.warning('Please enter a prompt with at least 10 characters');
      return;
    }
    setSegments(prev => [...prev, { id: Math.random().toString(36).slice(2), prompt: prompt.trim() }]);
    form.resetFields(['prompt']);
  };

  const removeSegment = (index: number) => {
    setSegments(prev => prev.filter((_, i) => i !== index));
  };

  const moveSegment = (from: number, to: number) => {
    if (to < 0 || to >= segments.length) return;
    const next = [...segments];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSegments(next);
  };

  const startGeneration = async () => {
    if (segments.length === 0) {
      message.info('Add at least one 8s segment');
      return;
    }
    setIsGenerating(true);
    const createdTaskIds: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const payload = {
        service_id: 2, // Use high-quality model by default
        prompt: `[LV:${groupId}][SEG:${i + 1}/${segments.length}] ${segment.prompt}`,
        prompt_optimizer: true,
      } as any;
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolve) => {
        dispatch({
          type: 'videoGeneration/createVideoTask',
          payload,
          callback: (taskId: string) => {
            createdTaskIds.push(taskId);
            resolve();
          }
        });
      });
    }
    setIsGenerating(false);
    history.push(`/tasks?tab=long&highlight=${createdTaskIds[0]}`);
  };

  return (
    <PageContainer
      title="Long Video Studio"
      subTitle="Chain multiple 8-second scenes into a longer video"
      onBack={() => history.push('/home')}
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Storyboard</Title>
            <Paragraph type="secondary">
              Add 8-second scene prompts. Reorder as needed, then generate all scenes. Each segment will run as a separate task.
            </Paragraph>
            <Tag color="purple">Project ID: {groupId}</Tag>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              name="prompt"
              label="Add Scene (8s prompt)"
              extra="Describe what happens in this 8-second scene."
            >
              <TextArea rows={4} maxLength={400} showCount placeholder="Example: Close-up of raindrops hitting a window at dusk, warm city lights bokeh in the background, slow push-in camera movement." />
            </Form.Item>
            <Space>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addSegment}>
                Add Segment
              </Button>
              <Tooltip title="Use a premium model for better quality">
                <Tag color="gold"><ThunderboltOutlined /> ULTRA Ready</Tag>
              </Tooltip>
            </Space>
          </Form>

          <Divider />

          <List
            header={<Title level={5} style={{ margin: 0 }}>Scene Segments ({segments.length})</Title>}
            dataSource={segments}
            locale={{ emptyText: 'No segments added yet' }}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button icon={<DragOutlined />} onClick={() => moveSegment(index, index - 1)} disabled={index === 0}>,</Button>,
                  <Button icon={<DragOutlined rotate={180} />} onClick={() => moveSegment(index, index + 1)} disabled={index === segments.length - 1}>,</Button>,
                  <Button icon={<EditOutlined />} onClick={() => setEditing({ index, prompt: item.prompt })}>,</Button>,
                  <Button danger icon={<DeleteOutlined />} onClick={() => removeSegment(index)}>,</Button>
                ]}
              >
                <List.Item.Meta
                  title={`Segment ${index + 1}`}
                  description={item.prompt}
                />
              </List.Item>
            )}
          />

          <Divider />

          <Space>
            <Button
              type="primary"
              size="large"
              icon={<VideoCameraAddOutlined />}
              onClick={startGeneration}
              loading={isGenerating}
              disabled={segments.length === 0}
            >
              Generate All Segments
            </Button>
            <Button size="large" onClick={() => setSegments([])} disabled={segments.length === 0}>Clear</Button>
          </Space>
        </Space>
      </Card>

      <Modal
        open={!!editing}
        title="Edit Segment"
        onCancel={() => setEditing(null)}
        onOk={() => {
          if (!editing) return;
          const next = [...segments];
          next[editing.index] = { ...next[editing.index], prompt: editing.prompt };
          setSegments(next);
          setEditing(null);
        }}
      >
        <TextArea
          rows={5}
          value={editing?.prompt}
          onChange={(e) => setEditing((prev) => (prev ? { ...prev, prompt: e.target.value } : prev))}
        />
      </Modal>
    </PageContainer>
  );
};

export default LongVideoStudio;


