/**
 * Layout do CRM
 * 
 * Wrapper que inclui o sidebar e o conteúdo das páginas do CRM
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import CrmSidebar from './CrmSidebar';
import CrmHeader from './CrmHeader';
import './CrmLayout.css';

const CrmLayout = () => {
  return (
    <div className="CrmLayout">
      <CrmHeader />
      <div className="CrmLayout-body">
        <CrmSidebar />
        <div className="CrmLayout-content">
          <div className="CrmLayout-page">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmLayout;

