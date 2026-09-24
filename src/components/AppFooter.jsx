import { Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';
import logo from '../assets/adapools-logo-128-wide.png';

const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <Layout.Footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-column">
          <Link to="/" className="footer-brand-logo-link" aria-label="adapools.xyz home">
            <img className="footer-brand-logo" src={logo} alt="adapools.xyz" />
          </Link>
          <Typography.Text strong className="footer-heading">adapools.xyz</Typography.Text>
          <Typography.Text type="secondary" className="footer-text">
            Real-time Cardano stake pool explorer: live block ticker, epoch progress and
            pool metrics for the Cardano mainnet, updated within seconds of each new block.
          </Typography.Text>
        </div>
        <div className="footer-column">
          <Typography.Text strong className="footer-heading">Links</Typography.Text>
          <nav className="footer-links">
            <div className="footer-project-link">
              <Link to="/">adapools.xyz</Link>
              <span>Cardano stake pool explorer</span>
            </div>
            <div className="footer-project-link">
              <Link to="/pools/retired">Recently retired pools</Link>
              <span>Latest Cardano retirement filings</span>
            </div>
            <div className="footer-project-link">
              <a href="https://adablox.com" target="_blank" rel="noreferrer">adablox.com</a>
              <span>Cardano network explorer</span>
            </div>
            <div className="footer-project-link">
              <a href="https://midnightblox.com" target="_blank" rel="noreferrer">midnightblox.com</a>
              <span>Midnight network explorer</span>
            </div>
          </nav>
        </div>
        <div className="footer-column">
          <Typography.Text strong className="footer-heading">About</Typography.Text>
          <Typography.Text type="secondary" className="footer-text">
            Powered by BLOX Pool, built as part of the Blox Cardano tooling family alongside
            the adablox and midnightblox block explorers.
          </Typography.Text>
        </div>
      </div>
      <div className="footer-bottom">
        <Typography.Text type="secondary" className="footer-copyright">
          &copy; {year} adapools.xyz &mdash; Independent Cardano stake pool explorer. Not affiliated with IOG or the Cardano Foundation.
        </Typography.Text>
      </div>
    </Layout.Footer>
  );
};

export default AppFooter;
