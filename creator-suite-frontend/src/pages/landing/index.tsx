import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Typography, Row, Col, Space, Tabs, Tag, Card, Avatar, Carousel } from 'antd';
import { PlayCircleOutlined, PictureOutlined, LoginOutlined, AudioOutlined, ApiOutlined, AppstoreOutlined, DownOutlined } from '@ant-design/icons';
import { history, useModel } from 'umi';
import { fetchShowcaseMedia, type ShowcaseItem } from './service';
const HowItWorks = React.lazy(() => import('./components/HowItWorks'));
const Stats = React.lazy(() => import('./components/Stats'));
const Faqs = React.lazy(() => import('./components/Faqs'));
const UseCases = React.lazy(() => import('./components/UseCases'));
const Features = React.lazy(() => import('./components/Features'));
const Security = React.lazy(() => import('./components/Security'));
const Integrations = React.lazy(() => import('./components/Integrations'));
const WorkflowTimeline = React.lazy(() => import('./components/WorkflowTimeline'));
const Philosophy = React.lazy(() => import('./components/Philosophy'));
const CaseStudies = React.lazy(() => import('./components/CaseStudies'));
const Comparison = React.lazy(() => import('./components/Comparison'));
const Guides = React.lazy(() => import('./components/Guides'));
const Performance = React.lazy(() => import('./components/Performance'));
const Support = React.lazy(() => import('./components/Support'));

const { Title, Paragraph, Text } = Typography;

const gradientBg = `#0b0b0b`;
const glow = '0 0 40px rgba(93, 63, 211, 0.45), 0 0 80px rgba(0, 153, 255, 0.25)';
const vintageCss = `
  @keyframes filmFlicker { 0% { opacity: .92; } 50% { opacity: 1; } 100% { opacity: .92; } }
  @keyframes gateWeave { 0% { transform: translateX(0px) } 50% { transform: translateX(.6px) } 100% { transform: translateX(-.6px) } }
  @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .nav-btn:hover { transform: translateY(-1px); }
  .primary-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,153,255,0.35); }
`;
const sectionContainer = { maxWidth: 1680, margin: '0 auto', padding: '0 clamp(24px, 4vw, 64px)' } as const;
const prose: React.CSSProperties = {
  fontSize: 'clamp(16px, 1.25vw, 19px)',
  lineHeight: 1.8,
  color: 'rgba(255,255,255,0.82)'
};
const proseNarrow: React.CSSProperties = {
  ...prose,
  maxWidth: 1100,
  margin: '12px auto 0'
};
const snapContainer: React.CSSProperties = {};
const snapSection: React.CSSProperties = {};

const LandingPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const isLoggedIn = !!initialState?.currentUser;
  const initialSamples: ShowcaseItem[] = [
    {
      kind: 'video',
      src: '/service-examples/veo-3.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Cinematic Sample',
    },
    {
      kind: 'video',
      src: '/service-examples/minimax-video-1.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Product Reel',
    },
    {
      kind: 'video',
      src: '/service-examples/minimaxhailu-2.mp4',
      thumbnail: '/service-examples/tmpikc6119g.jpg',
      title: 'Atom Visuals',
    },
  ];
  const [showcase, setShowcase] = useState<ShowcaseItem[]>(initialSamples);
  const filmRef = useRef<HTMLDivElement | null>(null);
  const [filmProgress, setFilmProgress] = useState(0);
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const exploreRef = useRef<HTMLDivElement | null>(null);
  const [exploreTab, setExploreTab] = useState<'all' | 'video' | 'image'>('all');
  const [exploreLimit, setExploreLimit] = useState(12);

  useEffect(() => {
    fetchShowcaseMedia().then((items) => {
      if (Array.isArray(items) && items.length > 0) setShowcase(items);
    });
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = filmRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const viewport = window.innerHeight || document.documentElement.clientHeight;
          const total = rect.height + viewport;
          const progress = Math.min(1, Math.max(0, (viewport - rect.top) / total));
          setFilmProgress(progress);
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredShowcase = React.useMemo(() => {
    if (exploreTab === 'all') return showcase;
    return showcase.filter((s) => s.kind === exploreTab);
  }, [exploreTab, showcase]);

  const framesCount = Math.max(1, Math.min(18, (showcase?.length || 0) > 0 ? Math.min(18, showcase.length) : 12));
  const steps = Math.max(1, framesCount - 1);
  const snappedFilmProgress = Math.round(filmProgress * steps) / steps;

  return (
    <PageContainer ghost title={false} style={{ padding: 0 }} className="landing-fullbleed">
      <div style={{
        minHeight: '100vh',
        background: gradientBg,
        position: 'relative',
        overflow: 'hidden',
        ...snapContainer,
        color: 'rgba(255,255,255,0.92)'
      }}>
        <style>{vintageCss}</style>
        {/* Sticky Header with subtle shadow */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '12px 24px',
          background: 'rgba(10, 15, 30, 0.55)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
        }}>
          <Row justify="space-between" align="middle" style={{ width: '100%', margin: 0 }}>
            <Col>
              <div onClick={() => history.push('/landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0099ff', boxShadow: '0 0 12px #0099ff' }} />
                <Title level={4} style={{ color: 'white', margin: 0 }}>DestinPQ</Title>
              </div>
            </Col>
            <Col flex="none">
              <Space size="large">
                <Button className="nav-btn" type="link" style={{ color: history.location.pathname === '/pricing' ? '#fff' : 'rgba(255,255,255,0.9)', textDecoration: history.location.pathname === '/pricing' ? 'underline' : 'none' }} onClick={() => history.push('/pricing')}>Pricing</Button>
                <Space>
                  <Button icon={<LoginOutlined />} type="default" style={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)', background: 'transparent' }} onClick={() => history.push('/user/login')}>Log in</Button>
                  <Button
                    type="primary"
                    className="primary-cta"
                    style={{
                      background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                      boxShadow: '0 6px 20px rgba(0,153,255,0.35)'
                    }}
                    icon={<PlayCircleOutlined />}
                    onClick={() => history.push(isLoggedIn ? '/home' : '/user/login')}
                  >
                    Generate
                  </Button>
                </Space>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Full-width background hero video + overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'min(88vh, 900px)', overflow: 'hidden', zIndex: 0 }}>
          <video src="/service-examples/veo-3.mp4" autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) saturate(1.1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,10,20,0.6) 0%, rgba(5,10,20,0.7) 40%, rgba(11,11,11,1) 100%)' }} />
        </div>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(1000px 500px at 20% -10%, rgba(0, 153, 255, 0.15), transparent), radial-gradient(800px 400px at 80% 10%, rgba(128, 0, 255, 0.15), transparent)',
          zIndex: 1
        }} />

        <Row justify="center" align="middle" style={{ textAlign: 'center', paddingTop: 96, position: 'relative', marginLeft: 0, marginRight: 0, paddingLeft: 'clamp(24px, 4vw, 64px)', paddingRight: 'clamp(24px, 4vw, 64px)', minHeight: 'min(88vh, 900px)', zIndex: 2 }}>
          <Col span={24}>
            <Title style={{ color: '#ffb142', fontSize: 'clamp(36px, 4.8vw, 68px)', marginBottom: 12, animation: 'fadeInUp 800ms ease both' }}>Turn Ideas Into Cinematic Reality</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.92)', fontSize: 'clamp(16px, 1.4vw, 22px)', animation: 'fadeInUp 1100ms ease both' }}>
              DestinPQ helps creators and teams generate film‑quality AI videos in minutes with full creative control.
            </Paragraph>

            {/* Removed framed video block in favor of full-width background hero */}

            <Space size="large" style={{ marginTop: 32, marginBottom: 8 }}>
              <Button
                type="primary"
                size="large"
                style={{
                  height: 48,
                  padding: '0 28px',
                  background: 'linear-gradient(90deg, #0099ff, #8000ff)',
                  boxShadow: '0 10px 30px rgba(0,153,255,0.35)'
                }}
                icon={<PlayCircleOutlined />}
                onClick={() => history.push(isLoggedIn ? '/home' : '/user/login')}
              >
                Generate Your Video
              </Button>
              <Button size="large" onClick={() => exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>See Examples</Button>
              <Button size="large" onClick={() => history.push('/pricing')}>Plans</Button>
            </Space>
            <div style={{ position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DownOutlined style={{ animation: 'bounce 1.6s infinite', fontSize: 18 }} />
            </div>
          </Col>
        </Row>

        {/* Sections with consistent padding (no excessive vertical whitespace) */}
        {/* Overview */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
          <Col span={24}>
            <Title level={2} style={{ color: 'white', textAlign: 'center' }}>AI video generation, built for creators and teams</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 960, margin: '12px auto 0' }}>
              DestinPQ turns ideas into cinematic videos in minutes. Compose multi‑scene stories, control camera and style, and iterate fast with
              safe, production‑ready models.
            </Paragraph>
              <div className="landing-card" style={{ maxWidth: 1200, margin: '16px auto 0', padding: 24 }}>
                <Paragraph style={{ ...proseNarrow, textAlign: 'center', margin: 0 }}>
                  Built by creators, for creators — our system pairs strong generative models with practical authoring tools. Draft a concept,
                  explore looks, and refine with precise controls for motion, pacing, framing, and lens. Everything is designed to keep you in the
                  flow: fast previews, predictable outputs, and versioned scenes that are easy to compare.
                </Paragraph>
                <Paragraph style={{ ...proseNarrow, textAlign: 'center', marginTop: 12 }}>
                  From pitch decks to final edits, DestinPQ acts as your creative copilot. Generate multiple variations from a single brief, bookmark
                  favorites, and swap alternates without breaking continuity. Share secure links with teammates, gather time‑coded comments, and
                  lock approved shots before render. When you are ready to publish, export color‑managed masters in the right aspect, codec, and
                  resolution for delivery across social, web, and broadcast. Produce faster, keep quality high, and stay fully in control.
                </Paragraph>
              </div>
          </Col>
        </Row>
          <div className="landing-card" style={{ maxWidth: 1280, margin: '32px auto 0', padding: 24 }}>
          <Row justify="center" style={{ marginTop: 0 }} gutter={[48, 32]}>
          <Col xs={24} md={12}>
            <Title level={3} style={{ color: 'white' }}>Why DestinPQ</Title>
              <ul style={{ ...prose, margin: '0 0 16px 18px' }}>
                <li>Cinematic quality with realistic motion and lighting</li>
                <li>Precise prompt adherence and negatives to avoid artifacts</li>
                <li>Storyboard long videos via reorderable 8‑second segments</li>
                <li>Image‑to‑video and reference‑guided looks for brand consistency</li>
              </ul>
              <Paragraph style={prose}>
                Our pipeline favors consistency across shots so characters, palettes, and composition stay coherent scene to scene. Controls for
                depth of field, shot scale, and tempo make it simple to match brand guidelines or a director’s board.
            </Paragraph>
          </Col>
          <Col xs={24} md={12}>
            <Title level={3} style={{ color: 'white' }}>What you can create</Title>
              <ul style={{ ...prose, margin: '0 0 16px 18px' }}>
                <li>Product promos, social reels, ads, explainers, short films</li>
                <li>Concept teasers and pitch visuals for pre‑production</li>
                <li>Animated loops, logo idents, cinematic b‑roll</li>
              </ul>
              <Paragraph style={prose}>
                Whether you are polishing a storyboard, generating style tests, or rendering final shots at high resolution, DestinPQ provides
                iterative tools and safe defaults so teams can move from draft to delivery confidently.
            </Paragraph>
          </Col>
        </Row>
          </div>
        </div>

        {/* Features grid */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Features</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Features />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* How it works */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>How it works</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <HowItWorks />
                </React.Suspense>
              </div>
              <div style={{ marginTop: 32 }}>
                <React.Suspense fallback={null}>
                  <WorkflowTimeline />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Capabilities */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
          <Col span={24}>
            <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Capabilities</Title>
              <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {[{
                  title: '4K‑ready pipeline',
                  body1: 'High fidelity frames with crisp detail and natural motion blur.',
                  body2: 'High‑bit‑depth intermediates ensure grading and VFX hold up under scrutiny.'
                }, {
                  title: 'Prompt adherence',
                  body1: 'Better control of camera, composition, timing, and style references.',
                  body2: 'Structured prompts and negatives keep the model focused and reduce artifacts.'
                }, {
                  title: 'Creative control',
                  body1: 'Negative prompts, reference images, and long‑video storyboards.',
                  body2: 'Blend looks, apply camera LUTs, and guide characters for continuity.'
                }].map((card, i) => (
                  <Col xs={24} md={12} lg={8} key={i}>
                    <div className="landing-card">
                      <Title level={4} style={{ color: '#ffb142', marginTop: 0 }}>{card.title}</Title>
                      <Paragraph style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>{card.body1}</Paragraph>
                      <Paragraph style={prose}>{card.body2}</Paragraph>
                    </div>
              </Col>
                ))}
            </Row>
          </Col>
        </Row>
        </div>

        {/* Security & compliance */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Security & compliance</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Security />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Integrations */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Integrations</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Integrations />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Philosophy & Technology */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Why we built this</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Philosophy />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Case Studies */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Case studies</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <CaseStudies />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Comparison */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Comparison</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Comparison />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Guides & Tutorials */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Guides</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Guides />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Performance */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Performance</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Performance />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Support */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Support & docs</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Support />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* FAQs */}
        <div style={{ ...sectionContainer, paddingTop: 64, paddingBottom: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>FAQs</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <Faqs />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Use cases */}
        <div style={{ ...sectionContainer, minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Use cases</Title>
              <div style={{ marginTop: 24 }}>
                <React.Suspense fallback={null}>
                  <UseCases />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Stats */}
        <div style={{ ...sectionContainer, minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>Proven at scale</Title>
              <div style={{ marginTop: 32 }}>
                <React.Suspense fallback={null}>
                  <Stats />
                </React.Suspense>
              </div>
            </Col>
          </Row>
        </div>

        {/* Trusted by section removed per UI clean-up */}

        {/* Testimonials */}
        <div style={{ ...sectionContainer, minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...snapSection }}>
          <Row justify="center">
            <Col span={24}>
              <Title level={2} style={{ color: 'white', textAlign: 'center' }}>What creators say</Title>
              <div style={{ marginTop: 24 }}>
                <Carousel autoplay autoplaySpeed={5000} dots>
                  {[{
                    quote: 'We storyboarded a full launch sequence in an afternoon. The shot control is miles ahead of anything else.',
                    name: 'Maya', title: 'Creative Director'
                  }, {
                    quote: 'Reliable prompt adherence and strong appearance guidance let us keep characters consistent across scenes.',
                    name: 'Jon', title: 'Animation Lead'
                  }, {
                    quote: 'Clients love side‑by‑side iterations. We move faster without sacrificing quality.',
                    name: 'Priya', title: 'Producer'
                  }].map((t, i) => (
                    <div key={i}>
                      <Row justify="center">
                        <Col xs={24} md={18} lg={14}>
                          <div className="landing-card" style={{ padding: 32, textAlign: 'center' }}>
                            <Avatar style={{ backgroundColor: '#722ed1' }} size={56}>{t.name[0]}</Avatar>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.92)', marginTop: 16, fontSize: 16 }}>
                              “{t.quote}”
                            </Paragraph>
                            <div style={{ color: 'rgba(255,255,255,0.75)' }}>— {t.name}, {t.title}</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Carousel>
              </div>
            </Col>
          </Row>
        </div>

        {/* CTA banner */}
        <div style={{ ...sectionContainer, paddingTop: 48, paddingBottom: 72 }}>
          <div className="landing-card" style={{ textAlign: 'center', padding: 32, background: 'linear-gradient(135deg, rgba(0,153,255,0.18), rgba(128,0,255,0.18))', border: '1px solid rgba(255,255,255,0.16)' }}>
            <Title level={3} style={{ color: 'white', marginTop: 0 }}>Ready to create?</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>Start generating cinematic videos and images in minutes.</Paragraph>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  style={{ background: 'linear-gradient(90deg, #0099ff, #8000ff)' }}
                  onClick={() => history.push('/user/login')}
                >
                  Get Started Free
                </Button>
                <Button size="large" onClick={() => history.push('/pricing')}>See Plans</Button>
              </Space>
              <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                No credit card required • 4K‑ready pipeline • Secure & private
              </div>
            </Space>
          </div>
        </div>

        {/* Removed duplicate Explore section above Film Roll */}

        {/* Film Roll Section */}
        <div ref={filmRef} style={{ position: 'relative', marginTop: 72, padding: '32px 0 96px' }}>
          <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: 16 }}>Cinematic Film Roll</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 40 }}>
            Scroll to run through frames of AI‑generated shots
          </Paragraph>
          <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
            {/* Film body */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(-50%) translateY(${(-snappedFilmProgress * 65).toFixed(2)}%)`,
                transition: 'transform 0.06s linear',
                width: 'min(1180px, 94vw)',
                borderRadius: 18,
                background: 'linear-gradient(180deg, rgba(18,18,18,0.9), rgba(6,6,6,0.9))',
                border: '1px solid rgba(0,0,0,0.8)',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.06), inset 0 -2px 0 rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.6)',
                padding: '28px clamp(48px, 6vw, 96px)',
              }}
            >
              {/* Perforations */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 8, width: 36, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,1) 3px, transparent 3px)', backgroundSize: '26px 26px', backgroundPosition: 'center 14px', opacity: 0.8, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 8, width: 36, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,1) 3px, transparent 3px)', backgroundSize: '26px 26px', backgroundPosition: 'center 14px', opacity: 0.8, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' }} />

              <div style={{ display: 'grid', rowGap: 18 }}>
                {(showcase.length > 0 ? showcase : []).slice(0, 18).map((item, i) => {
                  const frameSrc = item.kind === 'image' ? (item.thumbnail || item.src) : (item.thumbnail || '/service-examples/tmpikc6119g.jpg');
                  return (
                    <div key={i} style={{
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '2px solid #151515',
                      background: '#000',
                      aspectRatio: '16 / 9',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
                    }}>
                      <img
                        src={frameSrc}
                        alt={item.title || 'AI frame'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'filmFlicker 2s infinite linear, gateWeave 6s infinite ease-in-out' }}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/service-examples/tmpikc6119g.jpg';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Explore Grid */}
        <Row justify="center" style={{ marginTop: 96 }}>
          <Col xs={23} md={22} xl={20} xxl={18}>
            <Title level={3} style={{ color: 'white', textAlign: 'center', marginBottom: 8 }}>Explore</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24 }}>Featured generations from our community</Paragraph>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Tabs centered activeKey={exploreTab} onChange={(k) => setExploreTab(k as any)} items={[{ key: 'all', label: 'All' }, { key: 'video', label: 'Videos' }, { key: 'image', label: 'Images' }]} />
            </div>
            <Row gutter={[32,32]}>
              {(filteredShowcase || []).slice(0, 12).map((item, i) => (
                <Col xs={24} sm={12} md={8} key={i}>
                  <div style={{
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    boxShadow: glow
                  }}>
                    {item.kind === 'image' ? (
                      <img src={item.src} alt={item.title || 'Showcase'} style={{ width: '100%', display: 'block' }} />
                    ) : (
                      <video src={item.src} autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }} />
                    )}
                    <Tag color={item.kind === 'image' ? 'blue' : 'purple'} style={{ position: 'absolute', top: 8, left: 8 }}>{item.kind.toUpperCase()}</Tag>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default LandingPage;


