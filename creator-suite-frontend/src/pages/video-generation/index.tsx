import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Form, Input, Button, Card, Switch, Alert, Space, Typography, Select, Upload, message, Modal, List, Tag } from 'antd';
import { VideoCameraAddOutlined, UploadOutlined } from '@ant-design/icons';
import { history, useDispatch, useSelector, useSearchParams } from 'umi';
import type { VideoGenerationModelState } from './model';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface RootState {
  videoGeneration: VideoGenerationModelState;
  loading: any;
}

const VideoGenerationPage: React.FC = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const serviceId = parseInt(searchParams.get('service') || '1');
  const [form] = Form.useForm();
  const [vetModalVisible, setVetModalVisible] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  const [vetLoading, setVetLoading] = useState(false);

  const loading = useSelector((state: RootState) => state.loading?.effects?.['videoGeneration/createVideoTask']);
  const vetPromptLoading = useSelector((state: RootState) => state.loading?.effects?.['videoGeneration/vetPrompt']);

  const getServiceInfo = () => {
    if (serviceId === 1) {
      return {
        name: 'Video-Gen-High',
        title: 'Fast Video Generation',
        description: 'Generate videos quickly with simple prompts',
        showOptimizer: false,
        showAdvancedOptions: false,
        placeholder: 'Describe your video scene in simple terms. Example: A cat playing with a ball in a sunny garden.',
        tips: [
          'Keep prompts concise and clear',
          'Focus on one main action or scene',
          'Describe visual elements directly'
        ]
      };
    } else if (serviceId === 2) {
      return {
        name: 'Video-Gen-Max',
        title: 'High-Quality Video Generation',
        description: 'Create professional videos with advanced prompt optimization',
        showOptimizer: true,
        showAdvancedOptions: false,
        placeholder: 'Describe your video in detail. Example: A majestic eagle soaring through golden hour clouds, with cinematic camera movements capturing its powerful wings against the dramatic sky.',
        tips: [
          'Provide detailed descriptions',
          'Include camera angles and movements',
          'Describe lighting and atmosphere',
          'Enable prompt optimizer for best results'
        ]
      };
    } else {
      return {
        name: 'Video-Gen-ULTRA',
        title: 'Premium AI Video Generation',
        description: 'State-of-the-art video generation with cinematic quality',
        showOptimizer: false,
        showAdvancedOptions: true,
        placeholder: 'Describe your cinematic vision in detail. Example: A lone astronaut walking across a Martian landscape at sunset, with dramatic red-orange lighting casting long shadows across the rocky terrain.',
        tips: [
          'Use cinematic terminology and detailed descriptions',
          'Specify camera movements and angles',
          'Add an image url for image-to-video generation',
          'Use negative prompts to avoid unwanted elements',
          'Choose resolution based on your quality needs'
        ]
      };
    }
  };

  const serviceInfo = getServiceInfo();

  const handleVetPrompt = async (values: any) => {
    setVetLoading(true);
    dispatch({
      type: 'videoGeneration/vetPrompt',
      payload: {
        prompt: values.prompt,
        n_alternatives: 3
      },
      callback: (response: any) => {
        setVetLoading(false);
        setVetResult(response);
        
        if (response.allowed) {
          // If prompt is allowed, proceed with video generation
          handleSubmit(values);
        } else {
          // Show modal with alternatives
          setVetModalVisible(true);
        }
      },
      errorCallback: () => {
        setVetLoading(false);
      }
    });
  };

  const handleSelectAlternative = (alternativePrompt: string) => {
    form.setFieldsValue({
      prompt: alternativePrompt
    });
    setVetModalVisible(false);
  };

  const handleSubmit = async (values: any) => {
    let payload;
    
    if (serviceId === 3) {
      // Veo-3 specific payload
      payload = {
        service_id: serviceId,
        prompt: values.prompt,
        image: values.image || null,
        resolution: values.resolution || '720p',
        negative_prompt: values.negative_prompt || null,
      };
    } else {
      // Original models payload
      payload = {
        service_id: serviceId,
        prompt: values.prompt,
        prompt_optimizer: serviceInfo.showOptimizer ? values.prompt_optimizer : false,
      };
    }

    dispatch({
      type: 'videoGeneration/createVideoTask',
      payload,
      callback: (taskId: string) => {
        history.push(`/tasks?highlight=${taskId}`);
      },
    });
  };

  return (
    <PageContainer
      title={serviceInfo.title}
      subTitle={serviceInfo.description}
      onBack={() => history.push('/home')}
    >
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Using {serviceInfo.name}</Title>
            <Paragraph type="secondary">
              Enter your prompt below to generate a video.
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={serviceId === 3 ? handleVetPrompt : handleSubmit}
            initialValues={{
              prompt_optimizer: true,
              resolution: '720p',
            }}
          >
            <Form.Item
              name="prompt"
              label="Video Prompt"
              rules={[
                { required: true, message: 'Please enter a prompt' },
                { min: 10, message: 'Prompt must be at least 10 characters' }
              ]}
              extra={
                <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                  {serviceInfo.tips.map((tip, index) => (
                    <div key={index} style={{ color: '#666' }}>• {tip}</div>
                  ))}
                </Space>
              }
            >
              <TextArea
                rows={6}
                placeholder={serviceInfo.placeholder}
                maxLength={500}
                showCount
              />
            </Form.Item>

            {serviceInfo.showOptimizer && (
              <Form.Item
                name="prompt_optimizer"
                label="Prompt Optimizer"
                valuePropName="checked"
                extra="Automatically enhance your prompt for better results"
              >
                <Switch />
              </Form.Item>
            )}

            {serviceInfo.showAdvancedOptions && (
              <>
                <Form.Item
                  name="image"
                  label="Input Image (Optional)"
                  extra="Upload an image for image-to-video generation"
                >
                  <Upload
                    name="file"
                    action="https://video-api.destinpq.com/api/v1/azure-storage/upload"
                    listType="picture"
                    maxCount={1}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('You can only upload image files!');
                      }
                      const isLt5M = file.size / 1024 / 1024 < 5;
                      if (!isLt5M) {
                        message.error('Image must be smaller than 5MB!');
                      }
                      return isImage && isLt5M;
                    }}
                    onChange={(info) => {
                      if (info.file.status === 'uploading') {
                        return;
                      }
                      if (info.file.status === 'done') {
                        // Set the image URL from the response
                        if (info.file.response && info.file.response.url) {
                          form.setFieldsValue({
                            image: info.file.response.url
                          });
                          message.success(`${info.file.name} uploaded successfully`);
                        } else {
                          message.error(`${info.file.name} upload failed.`);
                        }
                      } else if (info.file.status === 'error') {
                        message.error(`${info.file.name} upload failed.`);
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload Image</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="resolution"
                  label="Resolution"
                  extra="Choose video resolution quality"
                >
                  <Select>
                    <Select.Option value="720p">720p (Standard)</Select.Option>
                    <Select.Option value="1080p">1080p (High Quality)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="negative_prompt"
                  label="Negative Prompt (Optional)"
                  extra="Describe what you DON'T want to see in the video"
                >
                  <TextArea
                    rows={3}
                    placeholder="Example: blurry, low quality, distorted faces, extra limbs"
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<VideoCameraAddOutlined />}
                loading={loading || vetLoading}
                block
              >
                Generate Video
              </Button>
            </Form.Item>
          </Form>

          <Alert
            message="Generation Time"
            description={`Videos typically take ${serviceId === 1 ? '3-4' : serviceId === 2 ? '4-5' : '6-8'} minutes to generate. You'll be redirected to the tasks page to track progress.`}
            type="info"
            showIcon
          />
        </Space>
      </Card>
      
      <Modal
        title="Content Policy Check"
        open={vetModalVisible}
        onCancel={() => setVetModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVetModalVisible(false)}>
            Cancel
          </Button>,
        ]}
        width={700}
      >
        {vetResult && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="Content Policy Violation Detected"
              description={
                <>
                  <p>Your prompt contains content that violates our policies:</p>
                  <div style={{ marginBottom: 10 }}>
                    {vetResult.violations.map((violation: string) => (
                      <Tag color="error" key={violation} style={{ marginBottom: 5 }}>
                        {violation.replace('_', ' ')}
                      </Tag>
                    ))}
                  </div>
                </>
              }
              type="error"
              showIcon
            />
            
            <div>
              <Typography.Title level={5}>Safe Alternatives</Typography.Title>
              <Typography.Paragraph type="secondary">
                Please select one of these safe alternatives or modify your prompt:
              </Typography.Paragraph>
              
              <List
                itemLayout="vertical"
                dataSource={vetResult.safe_alternatives}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button type="primary" onClick={() => handleSelectAlternative(item.prompt)}>
                        Use This Prompt
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.prompt}
                      description={<Typography.Text type="secondary">{item.notes}</Typography.Text>}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default VideoGenerationPage;