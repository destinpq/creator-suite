import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Slider,
  message,
  Space,
  Typography,
  Row,
  Col,
  Tabs,
  Modal,
  Tag,
  Tooltip,
  Progress,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  WalletOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import { videoService } from '@/services/video';
import { paymentService } from '@/services/payment';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface VideoGenerationProps {
  onVideoGenerated?: (video: any) => void;
}

const VideoGenerationStudio: React.FC<VideoGenerationProps> = ({ onVideoGenerated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [seedImage, setSeedImage] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [userCredits, setUserCredits] = useState(0);
  const [costEstimate, setCostEstimate] = useState(0);
  const [showPromptGuide, setShowPromptGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Predefined durations (multiples of 8)
  const durationOptions = [
    { value: 8, label: '8 seconds (1 credit)' },
    { value: 16, label: '16 seconds (2 credits)' },
    { value: 24, label: '24 seconds (3 credits)' },
    { value: 32, label: '32 seconds (4 credits)' },
    { value: 40, label: '40 seconds (5 credits)' },
    { value: 48, label: '48 seconds (6 credits)' },
    { value: 56, label: '56 seconds (7 credits)' },
    { value: 64, label: '64 seconds (8 credits)' },
    { value: 80, label: '80 seconds (10 credits)' },
    { value: 120, label: '2 minutes (15 credits)' },
    { value: 240, label: '4 minutes (30 credits)' },
    { value: 480, label: '8 minutes (60 credits)' },
    { value: 720, label: '12 minutes (90 credits)' },
    { value: 1200, label: '20 minutes (150 credits)' },
    { value: 1800, label: '30 minutes (225 credits)' }
  ];

  const resolutionOptions = [
    { value: '1280x768', label: 'Landscape (1280x768)' },
    { value: '768x1280', label: 'Portrait (768x1280)' },
    { value: '1024x1024', label: 'Square (1024x1024)' }
  ];

  // Prompt templates
  const promptTemplates = {
    cinematic: [
      "cinematic shot of a person walking through a futuristic city at golden hour",
      "epic wide shot of mountains with dramatic clouds, golden hour lighting",
      "close-up portrait of a person with intense eyes, soft diffused lighting"
    ],
    nature: [
      "macro shot of dewdrops on a flower petal with morning sunlight",
      "aerial view of ocean waves crashing on rocky coastline",
      "time-lapse of clouds moving over a mountain landscape"
    ],
    abstract: [
      "colorful paint splashing in slow motion against black background",
      "geometric shapes morphing and transforming with neon lighting",
      "liquid mercury flowing and forming organic shapes"
    ],
    urban: [
      "neon-lit cyberpunk street with rain reflections at night",
      "busy city intersection with light trails from traffic",
      "graffiti artist creating art on urban wall, handheld camera"
    ]
  };

  useEffect(() => {
    loadUserCredits();
  }, []);

  useEffect(() => {
    const duration = form.getFieldValue('duration') || 16;
    const segments = Math.ceil(duration / 8);
    setCostEstimate(segments);
  }, [form]);

  const loadUserCredits = async () => {
    try {
      const credits = await videoService.getUserCredits();
      setUserCredits(credits);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const handleSeedImageUpload = (file: any) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    setSeedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return false; // Prevent auto upload
  };

  const removeSeedImage = () => {
    setSeedImage(null);
    setPreviewUrl('');
  };

  const handleGenerate = async (values: any) => {
    if (costEstimate > userCredits) {
      message.error(`Insufficient credits. You need ${costEstimate} credits but have ${userCredits}.`);
      return;
    }

    setLoading(true);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 1, 95));
      }, 1000);

      const generateData: any = {
        prompt: values.prompt,
        duration: values.duration,
        resolution: values.resolution,
        model: 'gen3a_turbo'
      };

      // Add seed image if provided
      if (seedImage && previewUrl) {
        generateData.seed_image = previewUrl;
        generateData.seed_influence = values.seed_influence || 0.8;
      }

      const result = await videoService.generateVideo(generateData);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (result.success) {
        message.success('Video generated successfully!');
        onVideoGenerated?.(result);
        await loadUserCredits(); // Refresh credits
        form.resetFields();
        removeSeedImage();
      } else {
        message.error(`Generation failed: ${result.error}`);
      }
    } catch (error: any) {
      message.error(`Generation error: ${error.message}`);
    } finally {
      setLoading(false);
      setGenerationProgress(0);
    }
  };

  const insertTemplate = (template: string) => {
    form.setFieldsValue({ prompt: template });
  };

  const topUpCredits = async () => {
    try {
      const paymentUrl = await paymentService.createTopUpPayment(100); // Default 100 credits
      window.open(paymentUrl, '_blank');
    } catch (error) {
      message.error('Failed to initiate payment');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={2}>🎬 Runway Gen-3 Alpha Studio</Title>
              <Space>
                <Tag color="blue" icon={<WalletOutlined />}>
                  {userCredits} Credits
                </Tag>
                <Button 
                  type="primary" 
                  icon={<CreditCardOutlined />} 
                  onClick={topUpCredits}
                >
                  Top Up Credits
                </Button>
              </Space>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Basic Generation" key="basic">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleGenerate}
                  initialValues={{
                    duration: 16,
                    resolution: '1280x768',
                    seed_influence: 0.8
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Form.Item
                        label={
                          <Space>
                            Prompt
                            <Tooltip title="Describe what you want to see in your video">
                              <InfoCircleOutlined />
                            </Tooltip>
                          </Space>
                        }
                        name="prompt"
                        rules={[{ required: true, message: 'Please enter a prompt' }]}
                      >
                        <TextArea
                          rows={4}
                          placeholder="cinematic shot of a person walking through a futuristic city at golden hour, epic wide shot, dramatic lighting..."
                          maxLength={500}
                          showCount
                        />
                      </Form.Item>
                    </Col>

                    <Col md={12}>
                      <Form.Item
                        label="Duration"
                        name="duration"
                        rules={[{ required: true }]}
                      >
                        <Select 
                          placeholder="Select duration"
                          onChange={(value) => {
                            const segments = Math.ceil(value / 8);
                            setCostEstimate(segments);
                          }}
                        >
                          {durationOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col md={12}>
                      <Form.Item
                        label="Resolution"
                        name="resolution"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select resolution">
                          {resolutionOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {costEstimate > userCredits && (
                      <Col span={24}>
                        <Alert
                          message="Insufficient Credits"
                          description={`This video costs ${costEstimate} credits, but you only have ${userCredits}. Please top up your credits.`}
                          type="warning"
                          showIcon
                          action={
                            <Button type="primary" size="small" onClick={topUpCredits}>
                              Top Up
                            </Button>
                          }
                        />
                      </Col>
                    )}

                    <Col span={24}>
                      <Text strong>Cost Estimate: {costEstimate} credits</Text>
                    </Col>

                    <Col span={24}>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<PlayCircleOutlined />}
                          loading={loading}
                          size="large"
                          disabled={costEstimate > userCredits}
                          block
                        >
                          {loading ? 'Generating Video...' : 'Generate Video'}
                        </Button>
                      </Form.Item>
                    </Col>

                    {loading && (
                      <Col span={24}>
                        <Progress
                          percent={generationProgress}
                          status="active"
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                        <Text type="secondary">
                          Generating your video... This may take a few minutes.
                        </Text>
                      </Col>
                    )}
                  </Row>
                </Form>
              </TabPane>

              <TabPane tab="Seed Image" key="seed">
                <Row gutter={[16, 16]}>
                  <Col md={12}>
                    <Card title="Upload Seed Image" size="small">
                      <Upload
                        beforeUpload={handleSeedImageUpload}
                        onRemove={removeSeedImage}
                        fileList={seedImage ? [seedImage] : []}
                        accept="image/*"
                        listType="picture"
                      >
                        <Button icon={<UploadOutlined />}>
                          Select Image
                        </Button>
                      </Upload>
                      
                      <Paragraph type="secondary" style={{ marginTop: 16 }}>
                        Upload an image to use as a starting point for your video. 
                        The AI will animate based on this image.
                      </Paragraph>
                    </Card>

                    {previewUrl && (
                      <Card title="Seed Influence" size="small" style={{ marginTop: 16 }}>
                        <Form.Item
                          label="Influence Strength"
                          name="seed_influence"
                          tooltip="How closely the video should match the seed image (0.0 = loose inspiration, 1.0 = close match)"
                        >
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            marks={{
                              0: 'Loose',
                              0.5: 'Balanced',
                              1: 'Close'
                            }}
                          />
                        </Form.Item>
                      </Card>
                    )}
                  </Col>

                  <Col md={12}>
                    {previewUrl && (
                      <Card title="Preview" size="small">
                        <img
                          src={previewUrl}
                          alt="Seed preview"
                          style={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'contain',
                            borderRadius: 8
                          }}
                        />
                      </Card>
                    )}
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="Prompt Templates" key="templates">
                <Row gutter={[16, 16]}>
                  {Object.entries(promptTemplates).map(([category, templates]) => (
                    <Col md={12} key={category}>
                      <Card
                        title={category.charAt(0).toUpperCase() + category.slice(1)}
                        size="small"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {templates.map((template, index) => (
                            <Button
                              key={index}
                              type="dashed"
                              block
                              onClick={() => insertTemplate(template)}
                              style={{ textAlign: 'left', height: 'auto', padding: '8px 12px' }}
                            >
                              <Text ellipsis style={{ fontSize: '12px' }}>
                                {template}
                              </Text>
                            </Button>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </TabPane>

              <TabPane tab="Prompt Guide" key="guide">
                <Card>
                  <Title level={4}>🎯 Runway Gen-3 Alpha Prompt Guide</Title>
                  
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>🎬 Shot Types</Title>
                    <Space wrap>
                      <Tag>cinematic shot</Tag>
                      <Tag>epic wide shot</Tag>
                      <Tag>close-up portrait</Tag>
                      <Tag>aerial view</Tag>
                      <Tag>macro shot</Tag>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>🌅 Lighting</Title>
                    <Space wrap>
                      <Tag>golden hour</Tag>
                      <Tag>blue hour</Tag>
                      <Tag>dramatic lighting</Tag>
                      <Tag>soft diffused light</Tag>
                      <Tag>neon lighting</Tag>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>⚡ Camera Movement</Title>
                    <Space wrap>
                      <Tag>slow zoom in</Tag>
                      <Tag>smooth pan left</Tag>
                      <Tag>tracking shot</Tag>
                      <Tag>handheld camera</Tag>
                      <Tag>static shot</Tag>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>🎨 Visual Styles</Title>
                    <Space wrap>
                      <Tag>hyperrealistic</Tag>
                      <Tag>35mm film grain</Tag>
                      <Tag>high contrast</Tag>
                      <Tag>pastel colors</Tag>
                      <Tag>volumetric lighting</Tag>
                    </Space>
                  </div>

                  <Alert
                    message="Pro Tip"
                    description="Combine 2-3 keywords for best results. Example: 'cinematic shot + golden hour + slow zoom in + hyperrealistic'"
                    type="info"
                    showIcon
                  />
                </Card>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VideoGenerationStudio;
