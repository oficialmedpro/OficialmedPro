import React from 'react';
import { Building2, Globe, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import './AccountInfoCard.css';

interface AccountInfoCardProps {
  accountInfo: {
    id: string;
    name: string;
    account_status: number;
    currency: string;
    timezone_name: string;
  };
}

const AccountInfoCard: React.FC<AccountInfoCardProps> = ({ accountInfo }) => {
  const getAccountStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Ativa';
      case 2:
        return 'Desabilitada';
      case 3:
        return 'Desativada';
      case 7:
        return 'Pendente';
      case 8:
        return 'Pendente de Revisão';
      case 9:
        return 'Rejeitada';
      default:
        return 'Desconhecido';
    }
  };

  const getAccountStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return '#10b981';
      case 2:
      case 3:
        return '#ef4444';
      case 7:
      case 8:
        return '#f59e0b';
      case 9:
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getAccountStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <CheckCircle size={20} />;
      case 2:
      case 3:
      case 9:
        return <AlertCircle size={20} />;
      case 7:
      case 8:
        return <AlertCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  return (
    <div className="accountInfoCard">
      <div className="accountHeader">
        <div className="accountIcon">
          <Building2 size={24} />
        </div>
        <div className="accountTitle">
          <h3>Conta de Anúncios</h3>
          <p className="accountSubtitle">Informações da conta Meta Ads</p>
        </div>
        <div 
          className="accountStatus"
          style={{ backgroundColor: getAccountStatusColor(accountInfo.account_status) }}
        >
          {getAccountStatusIcon(accountInfo.account_status)}
          <span>{getAccountStatusText(accountInfo.account_status)}</span>
        </div>
      </div>

      <div className="accountDetails">
        <div className="detailRow">
          <div className="detailLabel">
            <Building2 size={16} />
            <span>Nome da Conta</span>
          </div>
          <div className="detailValue">
            {accountInfo.name}
          </div>
        </div>

        <div className="detailRow">
          <div className="detailLabel">
            <Globe size={16} />
            <span>ID da Conta</span>
          </div>
          <div className="detailValue">
            <code>{accountInfo.id}</code>
          </div>
        </div>

        <div className="detailRow">
          <div className="detailLabel">
            <Globe size={16} />
            <span>Moeda</span>
          </div>
          <div className="detailValue">
            {accountInfo.currency}
          </div>
        </div>

        <div className="detailRow">
          <div className="detailLabel">
            <Calendar size={16} />
            <span>Fuso Horário</span>
          </div>
          <div className="detailValue">
            {accountInfo.timezone_name}
          </div>
        </div>
      </div>

      <div className="accountFooter">
        <div className="connectionStatus">
          <CheckCircle size={16} />
          <span>Conectado à API do Meta</span>
        </div>
        <div className="lastSync">
          Última sincronização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default AccountInfoCard;

