import Head from 'next/head';
import Link from 'next/link';
import { Button, Card, Row, Col } from 'antd';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Creator Suite Next Starter</title>
      </Head>
      <main style={{padding: 24, maxWidth: 1200, margin: '0 auto'}}>
        <h1 style={{textAlign: 'center', marginBottom: 32}}>🎬 Creator Suite - Next.js Components</h1>
        <p style={{textAlign: 'center', marginBottom: 48, fontSize: '18px', color: '#666'}}>
          Successfully migrated advanced components from Vite to Next.js 14
        </p>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              title="🤖 AI Model Gallery"
              style={{height: '100%'}}
              extra={<Link href="/models">View</Link>}
            >
              <p>Display and compare AI models with ratings, pricing, and features.</p>
              <ul style={{paddingLeft: 20}}>
                <li>Model ratings and reviews</li>
                <li>Pricing information</li>
                <li>Feature comparison</li>
                <li>Provider details</li>
              </ul>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title="🎥 Video Gallery"
              style={{height: '100%'}}
              extra={<Link href="/videos">View</Link>}
            >
              <p>Comprehensive video management with search and filtering.</p>
              <ul style={{paddingLeft: 20}}>
                <li>Search and filter videos</li>
                <li>Modal video previews</li>
                <li>Batch operations</li>
                <li>Pagination support</li>
              </ul>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title="🎬 Video Generation Studio"
              style={{height: '100%'}}
              extra={<Link href="/video-studio">View</Link>}
            >
              <p>Advanced video generation with seed images and templates.</p>
              <ul style={{paddingLeft: 20}}>
                <li>Multi-tab interface</li>
                <li>Seed image upload</li>
                <li>Prompt templates</li>
                <li>Credit management</li>
              </ul>
            </Card>
          </Col>
        </Row>

        <div style={{textAlign: 'center', marginTop: 48}}>
          <h2>✨ Migration Complete</h2>
          <p style={{fontSize: '16px', color: '#666'}}>
            All components have been successfully migrated from Vite + Ant Design to Next.js 14 with:
          </p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: 16}}>
            <span style={{background: '#e6f7ff', color: '#1890ff', padding: '4px 12px', borderRadius: '16px'}}>TypeScript</span>
            <span style={{background: '#f6ffed', color: '#52c41a', padding: '4px 12px', borderRadius: '16px'}}>Custom Styling</span>
            <span style={{background: '#fff7e6', color: '#fa8c16', padding: '4px 12px', borderRadius: '16px'}}>React Icons</span>
            <span style={{background: '#f9f0ff', color: '#722ed1', padding: '4px 12px', borderRadius: '16px'}}>Responsive Design</span>
          </div>
        </div>
      </main>
    </div>
  )
}
