import { GithubOutlined, TwitterOutlined, LinkedinOutlined, YoutubeOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import { Input, Button, Space } from 'antd';
import React from 'react';
import { useLocation } from 'umi';

const Footer: React.FC = () => {
  const location = useLocation();
  const isLanding = ['/', '/landing'].includes(location.pathname);
  const textColor = isLanding ? 'rgba(255,255,255,0.85)' : undefined;
  const linkStyle = isLanding ? { color: 'rgba(255,255,255,0.85)' } : undefined;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      color: textColor,
      borderTop: '1px solid rgba(255,255,255,0.12)',
      paddingTop: 24,
      paddingBottom: 24,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <a href="/pricing" style={linkStyle}>Pricing</a>
              <a href="/privacy" style={linkStyle}>Privacy</a>
              <a href="/terms" style={linkStyle}>Terms</a>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://github.com/DestinPQ" target="_blank" rel="noreferrer" style={linkStyle}><GithubOutlined /></a>
              <a href="https://twitter.com/DestinPQ" target="_blank" rel="noreferrer" style={linkStyle}><TwitterOutlined /></a>
              <a href="https://www.linkedin.com/company/destinpq" target="_blank" rel="noreferrer" style={linkStyle}><LinkedinOutlined /></a>
              <a href="https://www.youtube.com/@DestinPQ" target="_blank" rel="noreferrer" style={linkStyle}><YoutubeOutlined /></a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ color: textColor }}>Join the Creator Community</span>
            <Space.Compact style={{ width: 360, maxWidth: '100%' }}>
              <Input placeholder="Your email" />
              <Button type="primary">Subscribe</Button>
            </Space.Compact>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: textColor }}>© {new Date().getFullYear()} DestinPQ — Build cinematic content with AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
