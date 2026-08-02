import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Footer from '../components/Footer/Footer'
import { supabase } from '../lib/supabase'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  padding: 40px 20px;
`

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`

const Subtitle = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`

const StatCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  font-size: 13px;
  color: var(--text-muted);
`

const Section = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`

const Admin = () => {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, comments: 0, bookmarks: 0 })
  const [recentUsers, setRecentUsers] = useState([])

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id, username, display_name, created_at').order('created_at', { ascending: false }).limit(10),
    ]).then(([users, comments, bookmarks, recent]) => {
      setStats({
        users: users.count || 0,
        comments: comments.count || 0,
        bookmarks: bookmarks.count || 0,
      })
      setRecentUsers(recent.data || [])
    }).catch(() => {})
  }, [user])

  if (loading || !user) return null

  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    return (
      <>
        <Page>
          <Container>
            <Title>Access Denied</Title>
            <Subtitle>You don't have admin access.</Subtitle>
            <Link to="/home" style={{ color: 'var(--accent)', fontSize: 14 }}>Back to Home</Link>
          </Container>
        </Page>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Page>
        <Container>
          <Title>Admin Dashboard</Title>
          <Subtitle>Manage users, content, and system health</Subtitle>

          <Grid>
            <StatCard>
              <StatValue>{stats.users}</StatValue>
              <StatLabel>Total Users</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.comments}</StatValue>
              <StatLabel>Comments</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{stats.bookmarks}</StatValue>
              <StatLabel>Bookmarks</StatLabel>
            </StatCard>
          </Grid>

          <Section>
            <SectionTitle>Recent Users</SectionTitle>
            {recentUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users yet</p>
            ) : (
              recentUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14 }}>{u.display_name || u.username || 'User'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
                </div>
              ))
            )}
          </Section>

          <Section>
            <SectionTitle>System Health</SectionTitle>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Supabase</p>
                <p style={{ fontSize: 14, color: '#22c55e' }}>Connected</p>
              </div>
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>API Backend</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Check /api/v1/health</p>
              </div>
            </div>
          </Section>
        </Container>
      </Page>
      <Footer />
    </>
  )
}

export default Admin
