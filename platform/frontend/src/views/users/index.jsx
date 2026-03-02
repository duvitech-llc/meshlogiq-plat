import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useAuthContext } from '@/contexts/AuthContext'
import { userService } from '@/services/userService'

const roleOptions = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'developer', label: 'Developer' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
]

const UsersView = () => {
  const { token, organizations, globalRole } = useAuthContext()
  const [selectedOrgUuid, setSelectedOrgUuid] = useState('')
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [membersError, setMembersError] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteError, setInviteError] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const [roleUpdates, setRoleUpdates] = useState({})
  const [roleActionLoading, setRoleActionLoading] = useState(null)
  const [roleActionError, setRoleActionError] = useState(null)

  useEffect(() => {
    if (!selectedOrgUuid && organizations?.length) {
      setSelectedOrgUuid(organizations[0].uuid)
    }
  }, [organizations, selectedOrgUuid])

  const selectedOrg = useMemo(() => {
    return organizations?.find((org) => org.uuid === selectedOrgUuid) || null
  }, [organizations, selectedOrgUuid])

  const isOwner = selectedOrg?.role === 'owner'
  const isAdmin = selectedOrg?.role === 'admin'
  const canManage = isOwner || isAdmin

  useEffect(() => {
    const loadMembers = async () => {
      if (!token || !selectedOrgUuid) return
      setLoadingMembers(true)
      setMembersError(null)
      const result = await userService.listOrganizationMembers(token, selectedOrgUuid)
      if (result.success) {
        setMembers(result.data)
      } else {
        setMembersError(result.error)
      }
      setLoadingMembers(false)
    }

    loadMembers()
  }, [token, selectedOrgUuid])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!selectedOrg || !inviteEmail) return
    setInviteLoading(true)
    setInviteError(null)
    setInviteResult(null)

    const result = await userService.createInvite(token, selectedOrg.slug, {
      email: inviteEmail,
      role: inviteRole,
    })

    if (result.success) {
      setInviteResult(result.data)
      setInviteEmail('')
      setInviteRole('viewer')
    } else {
      setInviteError(result.error)
    }

    setInviteLoading(false)
  }

  const handleRoleSelection = (membershipId, role) => {
    setRoleUpdates((prev) => ({ ...prev, [membershipId]: role }))
  }

  const handleRoleRequest = async (membershipId) => {
    const role = roleUpdates[membershipId]
    if (!role || !selectedOrg) return

    setRoleActionLoading(membershipId)
    setRoleActionError(null)

    const result = await userService.requestMemberRole(token, selectedOrg.uuid, membershipId, role)
    if (!result.success) {
      setRoleActionError(result.error)
    }

    setRoleActionLoading(null)

    const refresh = await userService.listOrganizationMembers(token, selectedOrg.uuid)
    if (refresh.success) setMembers(refresh.data)
  }

  const handleApprovePending = async (membershipId) => {
    if (!selectedOrg) return

    setRoleActionLoading(membershipId)
    setRoleActionError(null)

    const result = await userService.approveMemberRole(token, selectedOrg.uuid, membershipId)
    if (!result.success) {
      setRoleActionError(result.error)
    }

    setRoleActionLoading(null)

    const refresh = await userService.listOrganizationMembers(token, selectedOrg.uuid)
    if (refresh.success) setMembers(refresh.data)
  }

  return (
    <Container fluid>
      <PageBreadcrumb title={'Users'} />

      {!organizations?.length && (
        <Alert variant="warning" className="mt-3">
          You are not a member of any organization yet.
        </Alert>
      )}

      {organizations?.length > 0 && (
        <Row className="mb-4">
          <Col lg={6}>
            <Form.Group>
              <Form.Label>Organization</Form.Label>
              <Form.Select
                value={selectedOrgUuid}
                onChange={(e) => setSelectedOrgUuid(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.uuid} value={org.uuid}>
                    {org.name} ({org.role})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}

      {!canManage && organizations?.length > 0 && (
        <Alert variant="danger">
          This page is restricted to organization owners and admins.
        </Alert>
      )}

      {canManage && (
        <Row>
          <Col lg={6}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Invite user</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleInvite}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      New users will join as Viewer; elevated roles require owner approval.
                    </Form.Text>
                  </Form.Group>
                  {inviteError && <Alert variant="danger">{inviteError}</Alert>}
                  {inviteResult && (
                    <Alert variant="success" className="mt-3">
                      Invite created. Link: <a href={inviteResult.link}>{inviteResult.link}</a>
                    </Alert>
                  )}
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? 'Sending…' : 'Send invite'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={12}>
            <Card>
              <Card.Header className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Members</h5>
                {loadingMembers && <Spinner size="sm" />}
              </Card.Header>
              <Card.Body>
                {membersError && <Alert variant="danger">{membersError}</Alert>}
                {roleActionError && <Alert variant="danger">{roleActionError}</Alert>}
                <Table responsive hover className="mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Pending</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const selectedRole = roleUpdates[member.id] || member.pending_role || member.role
                      return (
                        <tr key={member.id}>
                          <td>{member.full_name || member.display_name || 'User'}</td>
                          <td>{member.email}</td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={selectedRole}
                              onChange={(e) => handleRoleSelection(member.id, e.target.value)}
                            >
                              {roleOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            {member.pending_role ? (
                              <Badge bg="warning" text="dark">
                                {member.pending_role} (pending)
                              </Badge>
                            ) : (
                              <Badge bg="success">None</Badge>
                            )}
                          </td>
                          <td className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant={isOwner ? 'primary' : 'outline-primary'}
                              disabled={roleActionLoading === member.id}
                              onClick={() => handleRoleRequest(member.id)}
                            >
                              {isOwner ? 'Update role' : 'Request change'}
                            </Button>
                            {isOwner && member.pending_role && (
                              <Button
                                size="sm"
                                variant="success"
                                disabled={roleActionLoading === member.id}
                                onClick={() => handleApprovePending(member.id)}
                              >
                                Approve pending
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {!canManage && globalRole && (
        <Alert variant="info" className="mt-4">
          Ask your organization owner to grant access to this section.
        </Alert>
      )}
    </Container>
  )
}

export default UsersView
