/**
 * Componente de Formulário de Contato
 * 
 * Formulário para criar ou editar contatos
 */

import React, { useState } from 'react';
import './CrmContactForm.css';
import { validateContact } from '../utils/crmValidators';

const CrmContactForm = ({ contact = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    notes: contact?.notes || ''
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erros ao editar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateContact(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors([error.message || 'Erro ao salvar contato']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="CrmContactForm" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="CrmContactForm-errors">
          {errors.map((error, index) => (
            <p key={index} className="CrmContactForm-error">{error}</p>
          ))}
        </div>
      )}

      <div className="CrmContactForm-field">
        <label className="CrmContactForm-label">
          Nome <span className="CrmContactForm-required">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="CrmContactForm-input"
          required
        />
      </div>

      <div className="CrmContactForm-field">
        <label className="CrmContactForm-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="CrmContactForm-input"
        />
      </div>

      <div className="CrmContactForm-field">
        <label className="CrmContactForm-label">Telefone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="CrmContactForm-input"
        />
      </div>

      <div className="CrmContactForm-field">
        <label className="CrmContactForm-label">Empresa</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="CrmContactForm-input"
        />
      </div>

      <div className="CrmContactForm-field">
        <label className="CrmContactForm-label">Observações</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="CrmContactForm-textarea"
          rows="4"
        />
      </div>

      <div className="CrmContactForm-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="CrmContactForm-btn CrmContactForm-cancel-btn"
            disabled={submitting}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="CrmContactForm-btn CrmContactForm-submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : contact ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  );
};

export default CrmContactForm;





