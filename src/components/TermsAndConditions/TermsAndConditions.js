import React from 'react';
import './TermsAndConditions.css';
import { createPortal } from 'react-dom';

export default function TermsAndConditions({ onAccept, onDecline }) {
    return createPortal(
    <div className="terms-overlay">
      <div className="terms-modal">
        <div className="terms-header">
          <h2>Terms & Conditions</h2>
          <p className="terms-subtitle">Please read and accept our terms to continue</p>
        </div>
        
        <div className="terms-content">
          <div className="terms-scroll">
            {/* <h3>AI Recipe Assistant Terms of Service</h3> */}
            
            <section>
              <h4>1. AI-Generated Content Disclaimer</h4>
              <p>
                Our recipe suggestions are generated by artificial intelligence. While we strive to provide 
                accurate and helpful recipes, we do not guarantee the safety, accuracy, or suitability of 
                any AI-generated content. Users should exercise caution and use their own judgment when 
                following any recipe suggestions.
              </p>
            </section>

            <section>
              <h4>2. Food Safety & Allergies</h4>
              <p>
                You are solely responsible for ensuring food safety and checking for allergens. Always 
                verify cooking temperatures, ingredient freshness, and potential allergen cross-contamination. 
                We are not liable for any adverse reactions, food poisoning, or health issues that may 
                result from following our recipe suggestions.
              </p>
            </section>

            <section>
              <h4>3. Data Collection & Privacy</h4>
              <p>
                By using our service, you consent to the collection and storage of your conversation data, 
                recipe preferences, and usage patterns. This data is stored securely and used to improve 
                our AI recommendations and user experience. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h4>4. User Account & Authentication</h4>
              <p>
                Registration through Google OAuth constitutes your acceptance of these terms. You are 
                responsible for maintaining the security of your account and all activities that occur 
                under your account.
              </p>
            </section>

            <section>
              <h4>5. Limitation of Liability</h4>
              <p>
                We provide this service "as is" without warranties of any kind. We shall not be liable 
                for any direct, indirect, incidental, or consequential damages arising from your use of 
                our service, including but not limited to cooking mishaps, ingredient allergies, or 
                food-related incidents.
              </p>
            </section>

            <section>
              <h4>6. Modifications to Terms</h4>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h4>7. Contact Information</h4>
              <p>
                If you have questions about these terms, please contact us through our support channels.
              </p>
            </section>
          </div>
        </div>
        
        <div className="terms-actions">
          <button className="btn-decline" onClick={onDecline}>
            Decline
          </button>
          <button className="btn-accept" onClick={onAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}