import * as fs from 'fs';
import * as path from 'path';

interface EmailTemplate {
  subject: string;
  from: {
    name: string;
    email: string;
  };
  content: any;
  styling: any;
}

interface TemplateVariables {
  firstName: string;
  lastName: string;
  userEmail: string;
  [key: string]: any;
}

export class EmailTemplateService {
  private static templateCache: Map<string, EmailTemplate> = new Map();

  /**
   * Load email template from JSON file
   */
  static loadTemplate(templateName: string): EmailTemplate {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.json`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON.parse(templateContent) as EmailTemplate;
      
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      throw new Error(`Email template not found: ${templateName}`);
    }
  }

  /**
   * Process template variables (replace {{variable}} placeholders)
   */
  static processVariables(text: string, variables: TemplateVariables): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  }

  /**
   * Generate email content from template
   */
  static generateEmail(templateName: string, variables: TemplateVariables) {
    const template = this.loadTemplate(templateName);
    
    // Process subject
    const subject = this.processVariables(template.subject, variables);
    
    // Process from field
    const from = `"${template.from.name}" <${template.from.email}>`;
    
    // Generate plain text content
    const textContent = this.generateTextContent(template, variables);
    
    // Generate HTML content
    const htmlContent = this.generateHtmlContent(template, variables);
    
    return {
      from,
      subject,
      text: textContent,
      html: htmlContent
    };
  }

  /**
   * Generate plain text email content
   */
  private static generateTextContent(template: EmailTemplate, variables: TemplateVariables): string {
    const content = template.content;
    let text = '';

    // Greeting
    text += this.processVariables(content.greeting, variables) + '\n\n';
    
    // Title
    if (content.title) {
      text += content.title + '\n\n';
    }
    
    // Announcement (for approval emails)
    if (content.announcement) {
      text += this.processVariables(content.announcement, variables) + '\n\n';
    }
    
    // Introduction
    if (content.introduction) {
      text += this.processVariables(content.introduction, variables) + '\n\n';
    }
    
    // Next steps
    if (content.nextSteps) {
      text += content.nextSteps.title + '\n\n';
      content.nextSteps.steps.forEach((step: string) => {
        text += this.processVariables(step, variables) + '\n';
      });
      text += '\n';
    }
    
    // Features (for welcome emails)
    if (content.features) {
      text += content.features.title + '\n';
      content.features.items.forEach((item: string) => {
        text += '• ' + this.processVariables(item, variables) + '\n';
      });
      text += '\n';
    }
    
    // Support section
    if (content.support) {
      text += this.processVariables(content.support.text, variables) + ' ';
      text += content.support.linkUrl + '\n\n';
    }
    
    // Closing
    if (content.closing) {
      text += this.processVariables(content.closing.message, variables) + '\n\n';
      text += content.closing.signature + '\n';
      text += content.closing.teamName + '\n\n';
    }
    
    // Footer
    if (content.footer) {
      text += '---\n';
      text += this.processVariables(content.footer.sentTo, variables) + '\n';
      text += content.footer.brandLine + '\n';
      text += content.footer.websiteText + ' ' + content.footer.websiteUrl;
    }
    
    return text.trim();
  }

  /**
   * Generate HTML email content
   */
  private static generateHtmlContent(template: EmailTemplate, variables: TemplateVariables): string {
    const content = template.content;
    const styling = template.styling;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${styling.backgroundColor};">
        <div style="background-color: ${styling.cardBackground}; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    `;
    
    // Title section
    if (content.title) {
      const titleColor = content.announcement ? styling.approvalColor : styling.primaryColor;
      html += `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${titleColor}; margin: 0; font-size: 28px;">${content.title}</h1>
        </div>
      `;
    }
    
    // Greeting
    html += `<p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor};">${this.processVariables(content.greeting, variables)}</p>`;
    
    // Announcement (for approval emails)
    if (content.announcement) {
      html += `
        <div style="background-color: ${styling.lightBackground}; border-left: 4px solid ${styling.approvalColor}; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor}; margin: 0;">
            ${this.processVariables(content.announcement, variables)}
          </p>
        </div>
      `;
    }
    
    // Introduction
    if (content.introduction) {
      html += `<p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor};">${this.processVariables(content.introduction, variables)}</p>`;
    }
    
    // Next steps
    if (content.nextSteps) {
      const bgColor = content.announcement ? styling.lightBackground : styling.lightBackground;
      html += `
        <div style="background-color: ${bgColor}; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: ${styling.primaryColor}; margin-top: 0;">${content.nextSteps.title}</h3>
          <ol style="line-height: 1.8; color: ${styling.textColor};">
      `;
      content.nextSteps.steps.forEach((step: string) => {
        html += `<li>${this.processVariables(step, variables)}</li>`;
      });
      html += `</ol></div>`;
    }
    
    // Features (for welcome emails)
    if (content.features) {
      html += `
        <div style="background-color: ${styling.secondaryBackground}; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: ${styling.primaryColor}; margin-top: 0;">${content.features.title}</h3>
          <ul style="line-height: 1.8; color: ${styling.textColor};">
      `;
      content.features.items.forEach((item: string) => {
        html += `<li>${this.processVariables(item, variables)}</li>`;
      });
      html += `</ul></div>`;
    }
    
    // Call to action (for approval emails)
    if (content.callToAction) {
      html += `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${content.callToAction.url}" style="background-color: ${styling.primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            ${content.callToAction.text}
          </a>
        </div>
      `;
    }
    
    // Support section
    if (content.support) {
      html += `
        <p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor};">
          ${this.processVariables(content.support.text, variables)} 
          <a href="${content.support.linkUrl}" style="color: ${styling.primaryColor}; text-decoration: none;">${content.support.linkText}</a>.
        </p>
      `;
    }
    
    // Closing
    if (content.closing) {
      html += `
        <p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor}; margin-top: 30px;">
          ${this.processVariables(content.closing.message, variables)}
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: ${styling.textColor};">
          ${content.closing.signature}<br>
          <strong>${content.closing.teamName}</strong>
        </p>
      `;
    }
    
    // Footer
    if (content.footer) {
      html += `
        <hr style="border: none; border-top: 1px solid ${styling.borderColor}; margin: 30px 0;">
        <div style="text-align: center; color: ${styling.footerColor}; font-size: 14px;">
          <p>${this.processVariables(content.footer.sentTo, variables)}</p>
          <p><strong>SeKondly</strong> - ${content.footer.brandLine}</p>
          <p>${content.footer.websiteText} <a href="${content.footer.websiteUrl}" style="color: ${styling.primaryColor};">${content.footer.websiteUrl}</a></p>
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Reload templates (clear cache)
   */
  static reloadTemplates(): void {
    this.templateCache.clear();
  }

  /**
   * Get list of available templates
   */
  static getAvailableTemplates(): string[] {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const files = fs.readdirSync(templatesDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Failed to read templates directory:', error);
      return [];
    }
  }
}
