import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, Select, Space, Alert, Typography, Row, Col, Divider, message } from 'antd';
import { PictureOutlined, SendOutlined, CrownOutlined } from '@ant-design/icons';
import { useDispatch, useSelector, useSearchParams, history } from 'umi';
import type { RootState } from '@/models';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Paragraph } = Typography;

const ImageGenerationPage: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service') || '4'; // Default to Imagen service
  
  const loading = useSelector((state: any) => state.loading.effects['imageGeneration/generateImage']);
  const { currentService } = useSelector((state: any) => state.imageGeneration);
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [safetyLevel, setSafetyLevel] = useState('block_only_high');

  useEffect(() => {
    // Set current service based on URL parameter
    dispatch({
      type: 'imageGeneration/setCurrentService',
      payload: parseInt(serviceId)
    });
  }, [serviceId, dispatch]);

  const handleSubmit = async (values: any) => {
    try {
      const response: any = await dispatch({
        type: 'imageGeneration/generateImage',
        payload: {
          prompt: values.prompt,
          aspect_ratio: values.aspectRatio,
          output_format: values.outputFormat,
          safety_filter_level: values.safetyLevel,
          service_id: parseInt(serviceId)
        }
      });

      if (response?.id) {
        message.success('Image generation started!');
        // Navigate to tasks page with highlight
        history.push(`/tasks?highlight=${response.id}&tab=images`);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to start image generation');
    }
  };

  const examplePrompts = [
    "A futuristic cityscape at sunset with flying cars and neon lights",
    "A serene mountain landscape with a crystal clear lake reflecting the peaks",
    "A whimsical forest scene with glowing mushrooms and fairy lights",
    "A steampunk-inspired mechanical dragon in a Victorian setting",
    "An underwater coral reef teeming with colorful tropical fish"
  ];

  const handleExampleClick = (examplePrompt: string) => {
    form.setFieldsValue({ prompt: examplePrompt });
    setPrompt(examplePrompt);
  };

  return (
    <PageContainer
      title={
        <Space>
          <PictureOutlined />
          Google Imagen 4 Ultra
          <CrownOutlined style={{ color: '#ffd700' }} />
        </Space>
      }
      subTitle="Create stunning, photorealistic images from text prompts"
      onBack={() => history.push('/home')}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                aspectRatio: '16:9',
                outputFormat: 'jpg',
                safetyLevel: 'block_only_high'
              }}
            >
              <Form.Item
                name="prompt"
                label={<Title level={5}>Describe your image</Title>}
                rules={[
                  { required: true, message: 'Please enter a prompt' },
                  { min: 10, message: 'Prompt should be at least 10 characters' }
                ]}
              >
                <TextArea
                  placeholder="Describe the image you want to create in detail..."
                  rows={6}
                  maxLength={2000}
                  showCount
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="aspectRatio"
                    label="Aspect Ratio"
                  >
                    <Select onChange={setAspectRatio}>
                      <Option value="1:1">1:1 (Square)</Option>
                      <Option value="9:16">9:16 (Portrait)</Option>
                      <Option value="16:9">16:9 (Landscape)</Option>
                      <Option value="3:4">3:4 (Portrait)</Option>
                      <Option value="4:3">4:3 (Landscape)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="outputFormat"
                    label="Output Format"
                  >
                    <Select onChange={setOutputFormat}>
                      <Option value="jpg">JPG</Option>
                      <Option value="png">PNG</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="safetyLevel"
                    label="Safety Filter"
                  >
                    <Select onChange={setSafetyLevel}>
                      <Option value="block_only_high">Most Permissive</Option>
                      <Option value="block_medium_and_above">Medium</Option>
                      <Option value="block_low_and_above">Strictest</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                    size="large"
                  >
                    Generate Image
                  </Button>
                  <Button
                    onClick={() => form.resetFields()}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Example Prompts" className="example-prompts-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              {examplePrompts.map((example, index) => (
                <Card
                  key={index}
                  hoverable
                  size="small"
                  onClick={() => handleExampleClick(example)}
                  style={{ cursor: 'pointer' }}
                >
                  <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                    {example}
                  </Paragraph>
                </Card>
              ))}
            </Space>
          </Card>

          <Card title="Tips for Better Results" style={{ marginTop: 16 }}>
            <ul style={{ paddingLeft: 20 }}>
              <li>Be specific and descriptive in your prompts</li>
              <li>Include details about lighting, style, and mood</li>
              <li>Mention artistic styles or references if desired</li>
              <li>Use adjectives to describe textures and materials</li>
              <li>Specify camera angles or perspectives</li>
            </ul>
          </Card>

          <Alert
            message="Generation Time"
            description="Images typically generate in 30-60 seconds. You'll be redirected to the tasks page to track progress."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default ImageGenerationPage;