import React from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import { LinkContainer, IndexLinkContainer } from 'react-router-bootstrap';

export default class Navigation extends React.Component {

    render() {
        return (
<Nav bsStyle="tabs">
    <IndexLinkContainer to="/">
        <NavItem>Home</NavItem>
    </IndexLinkContainer>
    <LinkContainer to="/split">
        <NavItem>Split</NavItem>
    </LinkContainer>
    <LinkContainer to="/cut">
        <NavItem>Cut</NavItem>
    </LinkContainer>
    <LinkContainer to="/help">
        <NavItem>Help</NavItem>
    </LinkContainer>
</Nav>);
    }
}
