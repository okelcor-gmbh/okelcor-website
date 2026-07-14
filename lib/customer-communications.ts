/**
 * Customer portal "Messages" model — the customer-facing side of CRM-6
 * e-mail communications. Two-way visibility is solved via this portal
 * thread, not true inbound-e-mail capture: a customer replying to the
 * actual e-mail in their inbox goes to the sending admin's personal inbox
 * as a normal e-mail, same as before this feature — it does not land here.
 */

export type CustomerCommunicationAttachment = {
  name: string;
  mime?: string | null;
  size?: number | null;
  download_url?: string | null;
};

export type CustomerCommunication = {
  id: number;
  direction: "inbound" | "outbound" | string;
  subject?: string | null;
  body?: string | null;
  cc?: string[] | null;
  attachments?: CustomerCommunicationAttachment[] | null;
  message_id?: string | null;
  in_reply_to?: number | null;
  admin_user_name?: string | null;
  status?: string;
  customer_read_at?: string | null;
  created_at: string;
};
